-- Lovi — a denúncia e a sanção passam a aparecer para quem olha
--
-- Conferido com o Lu em 21/09, logo depois da 0015 entrar no ar: denunciar
-- alguém não mudava nada na tela. O perfil continuava na fila, ainda dava para
-- curtir, e suspender a pessoa pelo painel também não tirava a conversa da
-- lista de quem estava do outro lado. A 0015 só fez a sanção morder QUEM foi
-- sancionado (não entra em fila nova, não curte, não escreve); faltou o outro
-- lado — quem já tinha a fila carregada, ou uma conversa aberta, seguia vendo
-- tudo como antes.
--
-- Duas decisões do Lu, e o que cada uma virou aqui:
--
--  1. Denunciar tira o perfil da fila de quem denunciou, na hora e para
--     sempre. NÃO é bloqueio: a conversa, se houver, continua — quem quiser
--     cortar o contato bloqueia, que é outro botão. A denúncia segue anônima,
--     e do lado de quem foi denunciado nada muda (ela continua vendo quem a
--     denunciou na fila dela, senão o sumiço entregaria a denúncia).
--  2. Suspenso ou banido some das conversas dos outros enquanto durar. Nada é
--     apagado: como sob_sancao() trata prazo vencido como conta ativa, no fim
--     da suspensão a conversa reaparece sozinha, com todo o histórico.
--
-- Só substitui funções e uma policy: pode ser aplicada antes do push.
--
-- As três funções abaixo foram copiadas da migration que as define HOJE
-- (fila_descobrir da 0015, meus_matches e perfil_do_match da 0003) e não
-- reescritas de cabeça. Na 0015 a fila foi copiada da 0003, que era a versão
-- velha, e o Postgres recusou na hora: a 0008 já tinha trocado intencao_filtro
-- de texto para lista.

-- ───────── 1. quem eu denunciei não volta para a minha fila ─────────
create or replace function public.fila_descobrir(p_limit int default 20, p_offset int default 0)
returns setof public.perfil_publico
language sql
security definer
stable
set search_path = public, extensions
as $$
  with eu as (
    select p.id, p.localizacao,
           pr.interesse_em, pr.intencao_filtro, pr.distancia_max_km,
           pr.idade_min, pr.idade_max
      from public.profiles p
      join public.profile_preferences pr on pr.user_id = p.id
     where p.id = auth.uid()
       and not public.sob_sancao(p.status_moderacao, p.suspensao_termina_em)
  )
  select
    o.id,
    o.nome,
    extract(year from age(o.data_nascimento))::int,
    o.genero,
    o.profissao,
    o.cidade,
    case
      when not o.mostrar_distancia then null
      when o.localizacao_aproximada then null
      when eu.localizacao is null or o.localizacao is null then null
      else round(st_distance(eu.localizacao, o.localizacao) / 1000.0)::int
    end,
    o.intencao,
    coalesce((select array_agg(i.interesse order by i.interesse)
                from public.profile_interests i where i.user_id = o.id), '{}'::text[]),
    o.bio,
    coalesce((select array_agg(f.storage_path order by f.principal desc, f.ordem, f.criado_em)
                from public.photos f
               where f.user_id = o.id and f.status_moderacao = 'aprovada'), '{}'::text[]),
    o.bebida, o.atividade, o.filhos, o.status_relacionamento, o.altura_m
  from public.profiles o
  cross join eu
  where o.id <> eu.id
    and o.visivel
    and o.onboarding_completo
    and o.data_nascimento is not null
    and not public.sob_sancao(o.status_moderacao, o.suspensao_termina_em)
    and (eu.interesse_em is null or eu.interesse_em = 'todos' or o.genero = eu.interesse_em)
    and (eu.intencao_filtro is null or o.intencao = any(eu.intencao_filtro))
    and extract(year from age(o.data_nascimento))::int between eu.idade_min and eu.idade_max
    and not exists (select 1 from public.swipes s
                     where s.de_user_id = eu.id and s.para_user_id = o.id)
    and not exists (select 1 from public.reports d
                     where d.denunciante_id = eu.id and d.denunciado_id = o.id)
    and not exists (select 1 from public.blocks b
                     where (b.bloqueador_id = eu.id and b.bloqueado_id = o.id)
                        or (b.bloqueador_id = o.id and b.bloqueado_id = eu.id))
    and (
      eu.localizacao is null
      or o.localizacao is null
      or st_dwithin(eu.localizacao, o.localizacao, eu.distancia_max_km * 1000)
    )
  order by
    o.localizacao_aproximada asc,
    case
      when eu.localizacao is null or o.localizacao is null then 1e9
      else st_distance(eu.localizacao, o.localizacao)
    end asc,
    o.criado_em desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
$$;

-- ───────── 2. sanção nas conversas ─────────
-- Mesma forma de bloqueio_no_match (0011), e pelo mesmo motivo: perguntar
-- direto em profiles dentro de uma policy roda sob o RLS de profiles, onde
-- cada um só enxerga a própria linha — a trava nunca dispararia. Responde só
-- para quem participa do match, então não serve para descobrir se um
-- estranho qualquer está suspenso.
create or replace function public.sancao_no_match(p_match_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
      from public.matches m
      join public.profiles p on p.id in (m.user_a, m.user_b)
     where m.id = p_match_id
       and (m.user_a = auth.uid() or m.user_b = auth.uid())
       and public.sob_sancao(p.status_moderacao, p.suspensao_termina_em)
  );
$$;

revoke all on function public.sancao_no_match(uuid) from public, anon;
grant execute on function public.sancao_no_match(uuid) to authenticated;

-- Ninguém escreve numa conversa em que um dos dois está sob sanção. Substitui
-- o "not estou_sob_sancao()" da 0015, que só olhava quem escrevia: agora pega
-- os dois lados, e quem sobrou com a conversa aberta na tela também não
-- consegue mandar mensagem para quem foi suspenso.
drop policy if exists messages_envia on public.messages;
create policy messages_envia on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and m.ativo
        and not m.finalizada
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
    and not public.bloqueio_no_match(messages.match_id)
    and not public.sancao_no_match(messages.match_id)
  );

-- ───────── 3. a conversa some da lista enquanto durar ─────────
create or replace function public.meus_matches()
returns table (
  match_id        uuid,
  outro_id        uuid,
  nome            text,
  foto            text,
  finalizada      boolean,
  criado_em       timestamptz,
  ultima_mensagem text,
  ultima_em       timestamptz,
  nao_lidas       int,
  total_mensagens int,
  eu_ja_enviei    boolean
)
language sql
security definer
stable
set search_path = public, extensions
as $$
  select
    m.id,
    outro.id,
    outro.nome,
    (select f.storage_path from public.photos f
      where f.user_id = outro.id and f.status_moderacao = 'aprovada'
      order by f.principal desc, f.ordem, f.criado_em limit 1),
    m.finalizada,
    m.criado_em,
    (select msg.conteudo from public.messages msg
      where msg.match_id = m.id order by msg.criado_em desc limit 1),
    (select msg.criado_em from public.messages msg
      where msg.match_id = m.id order by msg.criado_em desc limit 1),
    (select count(*)::int from public.messages msg
      where msg.match_id = m.id and msg.sender_id <> auth.uid() and msg.lida_em is null),
    (select count(*)::int from public.messages msg where msg.match_id = m.id),
    exists (select 1 from public.messages msg
             where msg.match_id = m.id and msg.sender_id = auth.uid())
  from public.matches m
  join public.profiles outro
    on outro.id = case when m.user_a = auth.uid() then m.user_b else m.user_a end
  where m.ativo
    and (m.user_a = auth.uid() or m.user_b = auth.uid())
    and not public.sob_sancao(outro.status_moderacao, outro.suspensao_termina_em)
    and not exists (
      select 1 from public.blocks b
       where (b.bloqueador_id = auth.uid() and b.bloqueado_id = outro.id)
          or (b.bloqueador_id = outro.id and b.bloqueado_id = auth.uid())
    )
  order by coalesce(
    (select msg.criado_em from public.messages msg
      where msg.match_id = m.id order by msg.criado_em desc limit 1),
    m.criado_em
  ) desc;
$$;

-- ───────── 4. e o perfil dela para de abrir ─────────
create or replace function public.perfil_do_match(p_user_id uuid)
returns setof public.perfil_publico
language sql
security definer
stable
set search_path = public, extensions
as $$
  select
    o.id,
    o.nome,
    extract(year from age(o.data_nascimento))::int,
    o.genero,
    o.profissao,
    o.cidade,
    case
      when not o.mostrar_distancia then null
      when o.localizacao_aproximada then null
      when eu.localizacao is null or o.localizacao is null then null
      else round(st_distance(eu.localizacao, o.localizacao) / 1000.0)::int
    end,
    o.intencao,
    coalesce((select array_agg(i.interesse order by i.interesse)
                from public.profile_interests i where i.user_id = o.id), '{}'::text[]),
    o.bio,
    coalesce((select array_agg(f.storage_path order by f.principal desc, f.ordem, f.criado_em)
                from public.photos f
               where f.user_id = o.id and f.status_moderacao = 'aprovada'), '{}'::text[]),
    o.bebida, o.atividade, o.filhos, o.status_relacionamento, o.altura_m
  from public.profiles o
  cross join (select id, localizacao from public.profiles where id = auth.uid()) eu
  where o.id = p_user_id
    and not public.sob_sancao(o.status_moderacao, o.suspensao_termina_em)
    and exists (
      select 1 from public.matches m
       where m.ativo
         and m.user_a = least(auth.uid(), p_user_id)
         and m.user_b = greatest(auth.uid(), p_user_id)
    )
    and not exists (
      select 1 from public.blocks b
       where (b.bloqueador_id = auth.uid() and b.bloqueado_id = p_user_id)
          or (b.bloqueador_id = p_user_id and b.bloqueado_id = auth.uid())
    );
$$;
