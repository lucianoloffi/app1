-- Lovi — moderação (entrega 2 do painel admin)
--
-- Até aqui a denúncia entrava e ficava parada: reports.status era gravado e
-- nunca lido, e não havia como suspender ou banir ninguém. Esta migration traz
-- o que a tela de Moderação precisa.
--
-- Decisões de produto tomadas junto com esta entrega (Lu, 21/09/2026):
--
--  1. A denúncia guarda uma CÓPIA da conversa, feita no momento em que a
--     denúncia é aberta. Sem isso a prova some: desfazer o match apaga as
--     mensagens (cascade), e quem assediou podia sumir com o que escreveu.
--  2. A denúncia SOBREVIVE à exclusão da conta do denunciado. Era o furo
--     oposto: reports.denunciado_id tinha cascade, então apagar a conta
--     apagava as denúncias feitas contra a pessoa. Agora o vínculo vira
--     "on delete set null" e o nome de quem foi denunciado fica copiado
--     dentro da denúncia.
--  3. "Banir" BLOQUEIA o acesso, não apaga a conta: é reversível (engano
--     acontece) e preserva as provas. Apagar de vez continua sendo possível à
--     mão, pelo SQL Editor.
--  4. Denúncia e cópia da conversa ficam guardadas sem prazo fixo, enquanto
--     houver conta envolvida no caso. Está na política de privacidade.
--
-- Vocabulário: profiles.status_moderacao é 'ativo' | 'suspenso' | 'banido' —
-- diferente de photos.status_moderacao ('pendente','aprovada','rejeitada') e
-- de profiles.verificacao_status ('nao_solicitada','pendente','aprovada',
-- 'rejeitada'). São três coisas distintas com nomes parecidos; conferir sempre
-- de qual se está falando.
--
-- Esta migration só ADICIONA (colunas, tabelas, funções). Nada que o cliente
-- antigo usa é retirado aqui — o que sai é a escrita direta em reports, e isso
-- fica na 0016, para aplicar depois do deploy.

-- ───────────────────── 1. sanção no perfil ─────────────────────
-- Colunas do servidor: a 0010 revogou UPDATE da tabela inteira e concedeu uma
-- lista de colunas, então coluna nova já nasce somente-leitura para o app.
-- Quem escreve aqui é a função moderar(), abaixo.
alter table public.profiles
  add column if not exists status_moderacao text not null default 'ativo',
  add column if not exists suspensao_termina_em timestamptz,
  add column if not exists moderacao_atualizada_em timestamptz;

alter table public.profiles drop constraint if exists profiles_status_moderacao_valido;
alter table public.profiles
  add constraint profiles_status_moderacao_valido
  check (status_moderacao in ('ativo','suspenso','banido'));

comment on column public.profiles.status_moderacao is
  'Decisão da moderação: ativo | suspenso | banido. Só o servidor escreve (função moderar). '
  'Diferente de visivel, que é escolha da própria pessoa.';
comment on column public.profiles.suspensao_termina_em is
  'Fim da suspensão. Vence sozinha: passada a data, a pessoa volta a usar o app sem ninguém rodar nada.';

-- Está sob sanção? Recebe os VALORES, não um id: não serve para perguntar
-- sobre outra pessoa, então pode ser usada em qualquer lugar sem vazar nada.
-- A suspensão vencida responde "não" — é assim que ela acaba sozinha.
create or replace function public.sob_sancao(p_status text, p_termina_em timestamptz)
returns boolean
language sql
stable
set search_path = public
as $$
  select p_status = 'banido'
      or (p_status = 'suspenso' and coalesce(p_termina_em, 'infinity'::timestamptz) > now());
$$;

revoke all on function public.sob_sancao(text, timestamptz) from public, anon;
grant execute on function public.sob_sancao(text, timestamptz) to authenticated;

-- A mesma pergunta sobre quem está logado. Precisa ser security definer para
-- ser usada dentro de uma policy: consultar profiles direto na policy roda sob
-- o RLS de profiles, e uma mudança futura lá deixaria a trava muda (é o que
-- aconteceu nas fotos, na 0006, e no bloqueio, na 0011).
create or replace function public.estou_sob_sancao()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select public.sob_sancao(p.status_moderacao, p.suspensao_termina_em)
       from public.profiles p where p.id = auth.uid()),
    false);
$$;

revoke all on function public.estou_sob_sancao() from public, anon;
grant execute on function public.estou_sob_sancao() to authenticated;

-- ───────────────────── 2. denúncia que guarda prova ─────────────────────
alter table public.reports
  add column if not exists resolucao text,
  add column if not exists analisado_por uuid references auth.users(id) on delete set null,
  add column if not exists analisado_em timestamptz,
  add column if not exists denunciado_nome text,
  add column if not exists conversa_copiada boolean not null default false;

alter table public.reports drop constraint if exists reports_resolucao_valida;
alter table public.reports
  add constraint reports_resolucao_valida
  check (resolucao is null or resolucao in ('arquivada','suspenso','banido'));

comment on column public.reports.denunciado_nome is
  'Nome de quem foi denunciado, copiado na hora da denúncia: continua legível depois que a conta é apagada.';
comment on column public.reports.conversa_copiada is
  'true = a denúncia passou pelo RPC denunciar e já tem cópia da conversa (mesmo que vazia). '
  'false = denúncia anterior a esta migration, sem cópia.';

-- denunciado_id deixa de levar a denúncia junto quando a conta é apagada.
do $$
declare
  v_constraint text;
begin
  select c.conname into v_constraint
    from pg_constraint c
   where c.conrelid = 'public.reports'::regclass
     and c.contype = 'f'
     and c.conkey = array[(select a.attnum from pg_attribute a
                            where a.attrelid = 'public.reports'::regclass
                              and a.attname = 'denunciado_id')];
  if v_constraint is not null then
    execute format('alter table public.reports drop constraint %I', v_constraint);
  end if;
end;
$$;

alter table public.reports alter column denunciado_id drop not null;
alter table public.reports
  add constraint reports_denunciado_fk
  foreign key (denunciado_id) references public.profiles(id) on delete set null;

comment on column public.reports.denunciado_id is
  'null = a conta denunciada foi excluída. A denúncia e a cópia da conversa continuam, como prova.';

create index if not exists reports_fila_idx on public.reports (status, criado_em desc);
create index if not exists reports_denunciado_idx on public.reports (denunciado_id);

-- Denúncias que já existiam ficam com o nome de quem foi denunciado.
update public.reports r
   set denunciado_nome = p.nome
  from public.profiles p
 where p.id = r.denunciado_id
   and r.denunciado_nome is null;

-- Cópia da conversa. Guarda o PAPEL de quem escreveu, não o id: continua
-- legível depois que qualquer uma das duas contas for apagada, e é o que a
-- moderação precisa ler. Só do servidor: RLS ligada, nenhuma policy.
create table if not exists public.report_mensagens (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.reports(id) on delete cascade,
  autor      text not null check (autor in ('denunciante','denunciado')),
  conteudo   text not null,
  enviada_em timestamptz not null,
  ordem      integer not null
);
create index if not exists report_mensagens_report_idx on public.report_mensagens (report_id, ordem);

-- Auditoria: quem decidiu o quê, quando. admin_email fica copiado porque a
-- conta do administrador também pode deixar de existir. alvo_id não é chave
-- estrangeira pelo mesmo motivo do histórico de matches (0013): o alvo pode
-- apagar a conta, o registro da decisão não some.
create table if not exists public.admin_actions (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references auth.users(id) on delete set null,
  admin_email text not null,
  acao        text not null check (acao in ('arquivar','suspender','banir','reativar')),
  report_id   uuid references public.reports(id) on delete set null,
  alvo_id     uuid,
  alvo_nome   text,
  detalhe     text,
  criado_em   timestamptz not null default now()
);
create index if not exists admin_actions_criado_idx on public.admin_actions (criado_em desc);

alter table public.report_mensagens enable row level security;
alter table public.admin_actions    enable row level security;
revoke all on public.report_mensagens, public.admin_actions from anon, authenticated;

-- Abrir denúncia passa a ser um RPC: é ele que copia a conversa, e é o único
-- jeito de a cópia acontecer sempre (o app não tem — nem deve ter — permissão
-- para escrever em report_mensagens). Mesmo desenho de solicitar_verificacao
-- (0010): uma chamada só, atômica, com o id de quem denuncia vindo do login.
--
-- Copia as 200 últimas mensagens da conversa. Acima disso não é mais leitura
-- de moderação, é arquivo; e o que interessa costuma estar no fim.
create or replace function public.denunciar(
  p_denunciado uuid,
  p_motivo     text,
  p_descricao  text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_report uuid;
  v_match  uuid;
begin
  if v_uid is null then
    raise exception 'Sua sessão expirou. Entre de novo.';
  end if;
  if p_denunciado is null or p_denunciado = v_uid then
    raise exception 'Denúncia inválida.';
  end if;
  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'Escolha um motivo para a denúncia.';
  end if;

  insert into public.reports (denunciante_id, denunciado_id, motivo, descricao,
                              denunciado_nome, conversa_copiada)
  select v_uid, p.id, btrim(p_motivo),
         nullif(btrim(coalesce(p_descricao, '')), ''), p.nome, true
    from public.profiles p
   where p.id = p_denunciado
  returning id into v_report;

  if v_report is null then
    raise exception 'Perfil não encontrado.';
  end if;

  -- O match pode estar desfeito ou finalizado: a conversa que houve interessa
  -- do mesmo jeito. Denúncia aberta a partir da fila não tem conversa nenhuma,
  -- e aí a cópia fica vazia (conversa_copiada segue true, para a tela saber a
  -- diferença entre "não houve conversa" e "denúncia antiga, sem cópia").
  select m.id into v_match
    from public.matches m
   where m.user_a = least(v_uid, p_denunciado)
     and m.user_b = greatest(v_uid, p_denunciado);

  if v_match is not null then
    insert into public.report_mensagens (report_id, autor, conteudo, enviada_em, ordem)
    select v_report,
           case when ultimas.sender_id = v_uid then 'denunciante' else 'denunciado' end,
           ultimas.conteudo,
           ultimas.criado_em,
           row_number() over (order by ultimas.criado_em)
      from (select msg.sender_id, msg.conteudo, msg.criado_em
              from public.messages msg
             where msg.match_id = v_match
             order by msg.criado_em desc
             limit 200) ultimas;
  end if;
end;
$$;

revoke all on function public.denunciar(uuid, text, text) from public, anon;
grant execute on function public.denunciar(uuid, text, text) to authenticated;

-- ───────────────────── 3. onde a sanção morde ─────────────────────
-- Três lugares, porque a tela do app é aviso, não tranca: quem estiver com uma
-- sessão aberta, ou chamando a API direto, esbarra no banco do mesmo jeito.

-- (a) A fila: quem está sob sanção some da fila dos outros, e não recebe fila
--     nenhuma (o cross join com "eu" não devolve linha).
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

-- (b) Curtir e dispensar. Aqui o erro é explícito, ao contrário do bloqueio
--     (que finge que deu certo): quem está suspenso precisa saber por que o
--     app parou de responder, e a informação é sobre a própria conta.
create or replace function public.registrar_swipe(p_para uuid, p_acao text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_match public.matches%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sessão expirada.';
  end if;
  if p_acao not in ('like','dislike') then
    raise exception 'Ação inválida.';
  end if;

  if public.estou_sob_sancao() then
    raise exception 'Sua conta está com o uso bloqueado pela moderação.' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.blocks b
     where (b.bloqueador_id = auth.uid() and b.bloqueado_id = p_para)
        or (b.bloqueador_id = p_para and b.bloqueado_id = auth.uid())
  ) then
    return jsonb_build_object('matched', false, 'match_id', null);
  end if;

  insert into public.swipes (de_user_id, para_user_id, acao)
  values (auth.uid(), p_para, p_acao)
  on conflict (de_user_id, para_user_id) do update set acao = excluded.acao;

  select * into v_match
    from public.matches
   where user_a = least(auth.uid(), p_para)
     and user_b = greatest(auth.uid(), p_para)
     and ativo;

  if found then
    return jsonb_build_object('matched', true, 'match_id', v_match.id);
  end if;

  return jsonb_build_object('matched', false, 'match_id', null);
end;
$$;

-- (c) Mensagens. As conversas que já existem continuam de pé para o outro lado
--     (inclusive para denunciar de novo); quem está sob sanção só não escreve.
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
    and not public.estou_sob_sancao()
  );

-- ───────────────────── 4. o painel enxerga as fotos ─────────────────────
-- "Fotos falsas ou de outra pessoa" é um dos motivos de denúncia: sem ver a
-- foto não dá para decidir. O administrador vê qualquer foto do bucket,
-- inclusive de perfil oculto, banido ou com foto rejeitada. Isso é acesso novo
-- a dado pessoal e está declarado na política de privacidade.
drop policy if exists fotos_le on storage.objects;
create policy fotos_le on storage.objects
  for select to authenticated using (
    bucket_id = 'fotos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.foto_visivel(name, created_at)
      or public.is_admin()
    )
  );

-- ───────────────────── 5. a fila de moderação ─────────────────────
-- Uma fila só, como foi desenhado: p_filtro escolhe entre o que está aberto e
-- o que já foi decidido. Devolve sempre a contagem de abertas, para o número
-- na aba não pedir uma segunda chamada.
create or replace function public.painel_moderacao(p_filtro text default 'abertas')
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_res jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel admin.' using errcode = '42501';
  end if;
  if p_filtro not in ('abertas','resolvidas') then
    raise exception 'Filtro inválido.';
  end if;

  select jsonb_build_object(
    'abertas', (select count(*) from public.reports where status <> 'resolvida'),
    'itens', coalesce((
      select jsonb_agg(item order by item_ordem desc)
        from (
          select coalesce(r.analisado_em, r.criado_em) as item_ordem,
                 jsonb_build_object(
                   'id', r.id,
                   'criado_em', r.criado_em,
                   'motivo', r.motivo,
                   'descricao', r.descricao,
                   'status', r.status,
                   'resolucao', r.resolucao,
                   'analisado_em', r.analisado_em,
                   'analisado_por', (select u.email from auth.users u where u.id = r.analisado_por),
                   'conversa_copiada', r.conversa_copiada,
                   'denunciado', jsonb_build_object(
                     'id', r.denunciado_id,
                     'nome', coalesce(nullif(btrim(coalesce(p.nome, r.denunciado_nome, '')), ''), 'Sem nome'),
                     'conta_excluida', r.denunciado_id is null,
                     'idade', case when p.data_nascimento is null then null
                                   else extract(year from age(p.data_nascimento))::int end,
                     'cidade', p.cidade,
                     'bio', p.bio,
                     'profissao', p.profissao,
                     'status_moderacao', p.status_moderacao,
                     'suspensao_termina_em', p.suspensao_termina_em,
                     'verificacao_status', p.verificacao_status,
                     'visivel', p.visivel,
                     'entrou_em', p.criado_em,
                     'denuncias_abertas', (select count(*) from public.reports r2
                                            where r2.denunciado_id = r.denunciado_id
                                              and r2.status <> 'resolvida'),
                     'denuncias_total', (select count(*) from public.reports r2
                                          where r2.denunciado_id = r.denunciado_id),
                     -- Todas as fotos, de qualquer status: a moderação precisa
                     -- ver inclusive a que já foi rejeitada.
                     'fotos', (select coalesce(jsonb_agg(f.storage_path
                                        order by f.principal desc, f.ordem, f.criado_em), '[]'::jsonb)
                                 from public.photos f where f.user_id = r.denunciado_id)
                   ),
                   'conversa', (select coalesce(jsonb_agg(jsonb_build_object(
                                         'autor', rm.autor,
                                         'conteudo', rm.conteudo,
                                         'enviada_em', rm.enviada_em) order by rm.ordem), '[]'::jsonb)
                                  from public.report_mensagens rm where rm.report_id = r.id)
                 ) as item
            from public.reports r
            left join public.profiles p on p.id = r.denunciado_id
           where case when p_filtro = 'abertas' then r.status <> 'resolvida'
                      else r.status = 'resolvida' end
           order by coalesce(r.analisado_em, r.criado_em) desc
           limit 50
        ) lista
    ), '[]'::jsonb)
  ) into v_res;

  return v_res;
end;
$$;

revoke all on function public.painel_moderacao(text) from public, anon;
grant execute on function public.painel_moderacao(text) to authenticated;

-- Só o número de denúncias esperando decisão, para o aviso na aba do painel.
-- Separado da fila porque a fila traz 50 denúncias com conversa e fotos: o
-- aviso precisa estar certo desde que o painel abre, inclusive na tela de
-- Números, e não vale carregar tudo isso para mostrar um número.
create or replace function public.painel_denuncias_abertas()
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel admin.' using errcode = '42501';
  end if;
  return (select count(*)::int from public.reports where status <> 'resolvida');
end;
$$;

revoke all on function public.painel_denuncias_abertas() from public, anon;
grant execute on function public.painel_denuncias_abertas() to authenticated;

-- ───────────────────── 6. as ações da moderação ─────────────────────
-- Arquivar / Suspender / Banir resolvem a denúncia; Reativar desfaz a sanção
-- (engano acontece, e um banimento sem volta seria porta de mão única).
--
-- Suspender e banir resolvem TAMBÉM as outras denúncias abertas contra a mesma
-- pessoa: foram decididas juntas, e deixá-las na fila faria a mesma pessoa
-- aparecer cinco vezes esperando decisão que já saiu.
--
-- Sem service role e sem Edge Function: nada aqui sai do Postgres, e is_admin()
-- é a mesma checagem da tela de Números. Service role no navegador continua
-- fora de cogitação; o dia em que a ação precisar apagar usuário do auth, aí
-- sim vira Edge Function.
create or replace function public.moderar(p_report_id uuid, p_acao text, p_dias int default 7)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin     uuid := auth.uid();
  v_email     text;
  v_r         public.reports%rowtype;
  v_status    text;
  v_ate       timestamptz;
  v_resolucao text;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel admin.' using errcode = '42501';
  end if;
  if p_acao not in ('arquivar','suspender','banir','reativar') then
    raise exception 'Ação inválida.';
  end if;
  if p_acao = 'suspender' and (p_dias is null or p_dias < 1 or p_dias > 365) then
    raise exception 'A suspensão precisa ser de 1 a 365 dias.';
  end if;

  select * into v_r from public.reports where id = p_report_id;
  if not found then
    raise exception 'Denúncia não encontrada.';
  end if;

  if p_acao <> 'arquivar' and v_r.denunciado_id is null then
    raise exception 'A conta denunciada não existe mais. Esta denúncia só pode ser arquivada.';
  end if;

  select u.email into v_email from auth.users u where u.id = v_admin;

  v_status := case p_acao when 'suspender' then 'suspenso'
                          when 'banir'     then 'banido'
                          when 'reativar'  then 'ativo' end;
  v_ate := case when p_acao = 'suspender' then now() + make_interval(days => p_dias) end;

  if v_status is not null then
    update public.profiles
       set status_moderacao = v_status,
           suspensao_termina_em = v_ate,
           moderacao_atualizada_em = now()
     where id = v_r.denunciado_id;
  end if;

  v_resolucao := case p_acao when 'arquivar'  then 'arquivada'
                             when 'suspender' then 'suspenso'
                             when 'banir'     then 'banido' end;

  if v_resolucao is not null then
    update public.reports
       set status = 'resolvida',
           resolucao = v_resolucao,
           analisado_por = v_admin,
           analisado_em = now()
     where id = v_r.id
        or (p_acao <> 'arquivar'
            and denunciado_id = v_r.denunciado_id
            and status <> 'resolvida');
  end if;

  insert into public.admin_actions (admin_id, admin_email, acao, report_id,
                                    alvo_id, alvo_nome, detalhe)
  values (v_admin, coalesce(v_email, 'desconhecido'), p_acao, v_r.id,
          v_r.denunciado_id, v_r.denunciado_nome,
          case when p_acao = 'suspender' then p_dias::text || ' dias' end);

  return jsonb_build_object(
    'acao', p_acao,
    'nome', coalesce(v_r.denunciado_nome, 'a pessoa'),
    'termina_em', v_ate
  );
end;
$$;

revoke all on function public.moderar(uuid, text, int) from public, anon;
grant execute on function public.moderar(uuid, text, int) to authenticated;
