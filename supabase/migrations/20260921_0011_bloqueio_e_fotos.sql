-- Lovi — bloqueio que não se desfaz por fora e fotos só para quem pode vê-las
--
-- Auditoria de 20/09/2026, reproduzida num Postgres local com as migrations
-- 0001–0010 e os papéis do Supabase simulados:
--
-- 1. O bloqueio podia ser desfeito pelo bloqueado. Ana bloqueia Bruno e o
--    match fica inativo, mas as curtidas continuam lá. Bruno apagava a
--    própria curtida (policy swipes_apaga_proprio) e a inseria de novo
--    (swipes_insere_proprio); o gatilho tg_match_por_curtida via a curtida
--    antiga da Ana, reativava o match, e messages_envia deixava Bruno
--    escrever para ela de novo. Nenhuma das três peças olhava bloqueios.
-- 2. Quem foi bloqueado continuava abrindo as fotos de quem o bloqueou, e
--    perfis que a pessoa ocultou (visivel = false) seguiam com as fotos
--    acessíveis: a policy fotos_le só perguntava "a foto está aprovada?".
-- 3. Uma foto aprovada podia ter a imagem trocada mantendo a aprovação:
--    fotos_atualiza permitia sobrescrever o arquivo, e apagar e reenviar com
--    o mesmo nome dava no mesmo. Hoje nada é moderado, mas isso viraria o
--    jeito de passar pela moderação no dia em que ela existir.
--
-- Depois desta migration os três casos são recusados, e o que o app faz
-- (curtir, dar match, conversar, ver fotos na fila, nas conversas e na lista
-- de bloqueados) segue funcionando. O app não muda: ele nunca gravou curtidas
-- direto, nunca sobrescreveu arquivo (upload com upsert: false) e sempre sobe
-- o arquivo ANTES de criar a linha em photos.
--
-- O que NÃO fecha: qualquer pessoa logada ainda consegue listar as fotos dos
-- perfis visíveis no app. É o mesmo que ela veria rolando a fila; impedir a
-- cópia em massa pede limite de uso, que é outro trabalho.

-- ───────────────────── 1. bloqueio ─────────────────────
-- Curtidas só entram e saem pelos RPCs registrar_swipe e desfazer_match
-- (security definer), que são o único caminho que o app usa. Sem escrita
-- direta, o truque de apagar e refazer a curtida deixa de existir.
drop policy if exists swipes_insere_proprio on public.swipes;
drop policy if exists swipes_apaga_proprio on public.swipes;
revoke insert, update, delete on public.swipes from authenticated;

-- Curtir alguém com bloqueio entre os dois não grava nada e não avisa: dizer
-- "você foi bloqueado" contaria a quem bloqueou que ela tentou de novo.
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

-- Segunda trava, no gatilho: mesmo que uma curtida entre por outro caminho
-- no futuro (script, service role), bloqueio impede criar ou reativar match.
create or replace function public.tg_match_por_curtida()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_a uuid;
  v_b uuid;
begin
  if new.acao <> 'like' then
    return new;
  end if;

  if not exists (
    select 1 from public.swipes s
    where s.de_user_id = new.para_user_id
      and s.para_user_id = new.de_user_id
      and s.acao = 'like'
  ) then
    return new;
  end if;

  if exists (
    select 1 from public.blocks b
     where (b.bloqueador_id = new.de_user_id and b.bloqueado_id = new.para_user_id)
        or (b.bloqueador_id = new.para_user_id and b.bloqueado_id = new.de_user_id)
  ) then
    return new;
  end if;

  v_a := least(new.de_user_id, new.para_user_id);
  v_b := greatest(new.de_user_id, new.para_user_id);

  insert into public.matches (user_a, user_b)
  values (v_a, v_b)
  on conflict (user_a, user_b) do update
    set ativo = true, finalizada = false, criado_em = now();

  return new;
end;
$$;

-- Terceira trava, na mensagem: com bloqueio entre os dois, ninguém escreve,
-- esteja o match como estiver.
--
-- A checagem precisa de uma função security definer. Consultar blocks direto
-- na policy roda sob o RLS de blocks, em que cada um só enxerga os bloqueios
-- que fez: quem FOI bloqueado não via o bloqueio e a trava não disparava
-- (reproduzido no teste, é o mesmo problema que a 0006 corrigiu nas fotos).
-- A função só responde para quem participa do match, então não serve para
-- perguntar se duas outras pessoas se bloquearam.
create or replace function public.bloqueio_no_match(p_match_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
      from public.matches m
      join public.blocks b
        on (b.bloqueador_id = m.user_a and b.bloqueado_id = m.user_b)
        or (b.bloqueador_id = m.user_b and b.bloqueado_id = m.user_a)
     where m.id = p_match_id
       and (m.user_a = auth.uid() or m.user_b = auth.uid())
  );
$$;

revoke all on function public.bloqueio_no_match(uuid) from public, anon;
grant execute on function public.bloqueio_no_match(uuid) to authenticated;

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
  );

-- Mensagem com mais de 2000 caracteres não é conversa, é abuso (ou erro).
-- not valid: vale para mensagens novas e não trava a migration por causa de
-- alguma antiga.
alter table public.messages drop constraint if exists mensagem_tamanho;
alter table public.messages
  add constraint mensagem_tamanho check (char_length(conteudo) <= 2000) not valid;

-- ───────────────────── 2 e 3. fotos ─────────────────────
-- Quem pode abrir a foto de outra pessoa, respondido num lugar só. Devolve só
-- sim/não, então enxergar a tabela inteira (security definer) não vaza nada.
--   * a foto está aprovada;
--   * o arquivo não foi reenviado depois da foto: o app sobe o arquivo antes
--     de criar a linha, então um arquivo bem mais novo que a linha é um
--     reenvio com o mesmo nome — e a aprovação era da imagem antiga. A folga
--     de 10 minutos cobre relógio e envio lento; trocar a imagem nesse
--     intervalo não burla nada, porque a moderação vem depois e vê a nova;
--   * o dono não bloqueou quem está olhando;
--   * e quem olha tem motivo para ver: o perfil está visível na fila, ou os
--     dois têm um match ativo, ou quem olha bloqueou o dono (a lista de
--     bloqueados mostra a foto para a pessoa saber quem está desbloqueando).
create or replace function public.foto_visivel(p_path text, p_arquivo_criado_em timestamptz)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
      from public.photos p
      join public.profiles o on o.id = p.user_id
     where p.storage_path = p_path
       and p.status_moderacao = 'aprovada'
       and p_arquivo_criado_em <= p.criado_em + interval '10 minutes'
       and not exists (
         select 1 from public.blocks b
          where b.bloqueador_id = o.id and b.bloqueado_id = auth.uid()
       )
       and (
         (o.visivel and o.onboarding_completo)
         or exists (
           select 1 from public.matches m
            where m.ativo
              and m.user_a = least(auth.uid(), o.id)
              and m.user_b = greatest(auth.uid(), o.id)
         )
         or exists (
           select 1 from public.blocks b
            where b.bloqueador_id = auth.uid() and b.bloqueado_id = o.id
         )
       )
  );
$$;

revoke all on function public.foto_visivel(text, timestamptz) from public, anon;
grant execute on function public.foto_visivel(text, timestamptz) to authenticated;

drop policy if exists fotos_le on storage.objects;
create policy fotos_le on storage.objects
  for select to authenticated using (
    bucket_id = 'fotos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.foto_visivel(name, created_at)
    )
  );

-- A regra antiga saiu da policy; sem uso, ela só serviria para alguém
-- perguntar "este arquivo é uma foto aprovada?" sobre qualquer caminho.
drop function if exists public.foto_aprovada(text);

-- Sem sobrescrever arquivo: o app só envia arquivo novo (nome aleatório) e
-- apaga. Trocar a imagem de uma foto é apagar a foto e enviar outra.
drop policy if exists fotos_atualiza on storage.objects;

-- A lista de bloqueados mostrava a primeira foto de qualquer status, inclusive
-- rejeitada — que nem abria, porque o storage recusava. Agora só aprovada.
create or replace function public.bloqueados()
returns table (id uuid, nome text, foto text, criado_em timestamptz)
language sql
security definer
stable
set search_path = public, extensions
as $$
  select p.id, p.nome,
         (select f.storage_path from public.photos f
           where f.user_id = p.id and f.status_moderacao = 'aprovada'
           order by f.principal desc, f.ordem, f.criado_em limit 1),
         b.criado_em
    from public.blocks b
    join public.profiles p on p.id = b.bloqueado_id
   where b.bloqueador_id = auth.uid()
   order by b.criado_em desc;
$$;

-- ───────────────────── avisos do Security Advisor ─────────────────────
-- "Function search path mutable": funções de gatilho sem search_path fixo.
-- Sem ele, a função procura tabelas no caminho de quem a disparou.
alter function public.tg_atualiza_timestamp()            set search_path = public;
alter function public.tg_limite_fotos()                  set search_path = public;
alter function public.tg_limite_interesses()             set search_path = public;
alter function public.tg_telefone_novo_nao_verificado()  set search_path = public;
alter function public.tg_valida_nascimento()             set search_path = public;
alter function public.tg_valida_onboarding_completo()    set search_path = public;

-- "RLS disabled in public: spatial_ref_sys": tabela do PostGIS com a lista de
-- sistemas de coordenadas. Não tem dado de ninguém, e ligar RLS nela exige ser
-- o dono (supabase_admin), então o aviso continua. O que dá para fazer é tirar
-- a escrita pela API — se o papel que roda a migration tiver permissão para
-- isso; se não tiver, segue sem erro. Leitura fica: o PostGIS usa a tabela.
do $$
begin
  revoke insert, update, delete, truncate on public.spatial_ref_sys from anon, authenticated;
exception when others then
  raise notice 'spatial_ref_sys: sem permissão para revogar escrita (%). Segue sem mudança.', sqlerrm;
end;
$$;
