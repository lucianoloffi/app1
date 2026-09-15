-- Lovi — Fase 1: funções de leitura e escrita
-- Este arquivo define o ÚNICO caminho pelo qual uma pessoa vê outra.
-- Nenhuma delas devolve telefone, e-mail, data de nascimento, coordenadas,
-- preferências, swipes, bloqueios, denúncias ou verificações de terceiros.

-- Forma pública de um perfil: espelha o type Profile de src/types.ts.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'perfil_publico') then
    create type public.perfil_publico as (
      id                    uuid,
      name                  text,
      age                   int,
      gender                text,
      profession            text,
      city                  text,
      distance_km           int,
      intention             text,
      interests             text[],
      bio                   text,
      photos                text[],
      bebida                text,
      atividade             text,
      filhos                text,
      relationship_status   text,
      height                numeric
    );
  end if;
end;
$$;

-- ───────────────────── fila do Descobrir ─────────────────────
-- Filtros (interesse, intenção, distância e faixa etária) aplicados aqui,
-- no servidor, a partir de profile_preferences.
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
    and (eu.interesse_em is null or eu.interesse_em = 'todos' or o.genero = eu.interesse_em)
    and (eu.intencao_filtro = 'todas' or o.intencao = eu.intencao_filtro)
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

-- ───────── perfil de alguém com quem já existe match ─────────
-- A fila exclui quem já recebeu swipe (e portanto todos os matches);
-- este é o caminho usado pela lista de conversas e pelo "ver perfil completo".
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

-- ───────────────────── lista de conversas ─────────────────────
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

-- ───────────────────── perfis bloqueados ─────────────────────
create or replace function public.bloqueados()
returns table (id uuid, nome text, foto text, criado_em timestamptz)
language sql
security definer
stable
set search_path = public, extensions
as $$
  select p.id, p.nome,
         (select f.storage_path from public.photos f
           where f.user_id = p.id
           order by f.principal desc, f.ordem, f.criado_em limit 1),
         b.criado_em
    from public.blocks b
    join public.profiles p on p.id = b.bloqueado_id
   where b.bloqueador_id = auth.uid()
   order by b.criado_em desc;
$$;

-- ───────────────────── swipe e match ─────────────────────
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

-- Desfazer match: apaga os dois swipes (o perfil volta para a fila)
-- e desativa o match. As mensagens vão junto, por cascade do match.
create or replace function public.desfazer_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_match public.matches%rowtype;
  v_outro uuid;
begin
  select * into v_match from public.matches where id = p_match_id;
  if not found or (v_match.user_a <> auth.uid() and v_match.user_b <> auth.uid()) then
    raise exception 'Match não encontrado.';
  end if;

  v_outro := case when v_match.user_a = auth.uid() then v_match.user_b else v_match.user_a end;

  delete from public.swipes
   where (de_user_id = auth.uid() and para_user_id = v_outro)
      or (de_user_id = v_outro and para_user_id = auth.uid());

  delete from public.matches where id = p_match_id;
end;
$$;

-- "Finalizar conversa" / reabrir — reversível pelos dois lados
create or replace function public.definir_conversa_finalizada(p_match_id uuid, p_finalizada boolean)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.matches
     set finalizada = p_finalizada
   where id = p_match_id
     and ativo
     and (user_a = auth.uid() or user_b = auth.uid());

  if not found then
    raise exception 'Match não encontrado.';
  end if;
end;
$$;

create or replace function public.marcar_mensagens_lidas(p_match_id uuid)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  update public.messages
     set lida_em = now()
   where match_id = p_match_id
     and sender_id <> auth.uid()
     and lida_em is null
     and exists (
       select 1 from public.matches m
        where m.id = p_match_id and (m.user_a = auth.uid() or m.user_b = auth.uid())
     );
$$;

-- ───────────────────── localização ─────────────────────
-- A coordenada já chega arredondada do dispositivo; arredondamos de novo aqui
-- para que o servidor jamais grave uma posição exata, mesmo que o cliente falhe.
create or replace function public.atualizar_localizacao(p_lat double precision, p_lng double precision)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_lat is null or p_lng is null then
    raise exception 'Coordenada inválida.';
  end if;

  update public.profiles
     set localizacao = st_setsrid(st_makepoint(round(p_lng::numeric, 2)::double precision,
                                               round(p_lat::numeric, 2)::double precision), 4326)::geography,
         localizacao_atualizada_em = now(),
         localizacao_aproximada = false
   where id = auth.uid();
end;
$$;

-- Fallback: usa o centro do município escolhido e marca o perfil como aproximado
create or replace function public.usar_localizacao_da_cidade(p_cidade text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_centro geography;
begin
  select centro into v_centro from public.cities where nome = p_cidade;
  if v_centro is null then
    raise exception 'Cidade não encontrada.';
  end if;

  update public.profiles
     set localizacao = v_centro,
         localizacao_atualizada_em = now(),
         localizacao_aproximada = true
   where id = auth.uid();
end;
$$;

-- ───────────────────── portabilidade (LGPD) ─────────────────────
create or replace function public.exportar_meus_dados()
returns jsonb
language sql
security definer
stable
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'exportado_em', now(),
    'perfil', (
      select to_jsonb(p) - 'localizacao'
        from public.profiles p where p.id = auth.uid()
    ),
    'preferencias', (select to_jsonb(x) from public.profile_preferences x where x.user_id = auth.uid()),
    'interesses', (select coalesce(jsonb_agg(i.interesse order by i.interesse), '[]'::jsonb)
                     from public.profile_interests i where i.user_id = auth.uid()),
    'fotos', (select coalesce(jsonb_agg(to_jsonb(f) order by f.ordem), '[]'::jsonb)
                from public.photos f where f.user_id = auth.uid()),
    'ajustes', (select to_jsonb(s) from public.settings s where s.user_id = auth.uid()),
    'consentimentos', (select coalesce(jsonb_agg(to_jsonb(c) order by c.aceito_em), '[]'::jsonb)
                         from public.consents c where c.user_id = auth.uid()),
    'curtidas_enviadas', (select coalesce(jsonb_agg(jsonb_build_object(
                             'acao', s.acao, 'criado_em', s.criado_em)), '[]'::jsonb)
                            from public.swipes s where s.de_user_id = auth.uid()),
    'matches', (select coalesce(jsonb_agg(jsonb_build_object(
                    'match_id', m.id, 'criado_em', m.criado_em, 'finalizada', m.finalizada)), '[]'::jsonb)
                  from public.matches m
                 where m.ativo and (m.user_a = auth.uid() or m.user_b = auth.uid())),
    'mensagens_enviadas', (select coalesce(jsonb_agg(jsonb_build_object(
                               'conteudo', msg.conteudo, 'criado_em', msg.criado_em)
                               order by msg.criado_em), '[]'::jsonb)
                             from public.messages msg where msg.sender_id = auth.uid()),
    'bloqueios', (select coalesce(jsonb_agg(jsonb_build_object(
                      'criado_em', b.criado_em)), '[]'::jsonb)
                    from public.blocks b where b.bloqueador_id = auth.uid()),
    'denuncias', (select coalesce(jsonb_agg(jsonb_build_object(
                      'motivo', r.motivo, 'descricao', r.descricao,
                      'status', r.status, 'criado_em', r.criado_em)), '[]'::jsonb)
                    from public.reports r where r.denunciante_id = auth.uid()),
    'verificacoes', (select coalesce(jsonb_agg(jsonb_build_object(
                         'status', v.status, 'criado_em', v.criado_em)), '[]'::jsonb)
                       from public.verificacoes v where v.user_id = auth.uid())
  );
$$;

-- ───────────────────── permissões ─────────────────────
revoke all on function public.fila_descobrir(int, int)                     from public, anon;
revoke all on function public.perfil_do_match(uuid)                        from public, anon;
revoke all on function public.meus_matches()                               from public, anon;
revoke all on function public.bloqueados()                                 from public, anon;
revoke all on function public.registrar_swipe(uuid, text)                  from public, anon;
revoke all on function public.desfazer_match(uuid)                         from public, anon;
revoke all on function public.definir_conversa_finalizada(uuid, boolean)   from public, anon;
revoke all on function public.marcar_mensagens_lidas(uuid)                 from public, anon;
revoke all on function public.atualizar_localizacao(double precision, double precision) from public, anon;
revoke all on function public.usar_localizacao_da_cidade(text)             from public, anon;
revoke all on function public.exportar_meus_dados()                        from public, anon;

grant execute on function public.fila_descobrir(int, int)                     to authenticated;
grant execute on function public.perfil_do_match(uuid)                        to authenticated;
grant execute on function public.meus_matches()                               to authenticated;
grant execute on function public.bloqueados()                                 to authenticated;
grant execute on function public.registrar_swipe(uuid, text)                  to authenticated;
grant execute on function public.desfazer_match(uuid)                         to authenticated;
grant execute on function public.definir_conversa_finalizada(uuid, boolean)   to authenticated;
grant execute on function public.marcar_mensagens_lidas(uuid)                 to authenticated;
grant execute on function public.atualizar_localizacao(double precision, double precision) to authenticated;
grant execute on function public.usar_localizacao_da_cidade(text)             to authenticated;
grant execute on function public.exportar_meus_dados()                        to authenticated;
