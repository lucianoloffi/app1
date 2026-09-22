-- Lovi — o selo de verificado viaja junto com o perfil
--
-- A pessoa via o próprio selo na tela de Perfil, mas ninguém MAIS via: o
-- perfil aberto a partir de uma conversa não tinha como mostrar a tag, porque
-- o tipo perfil_publico — que é tudo o que o app sabe sobre outra pessoa —
-- não carregava a informação. O selo só servia para quem já sabia que tinha.
--
-- Ordem do deploy: esta migration MUDA o formato de retorno de duas funções
-- que o cliente antigo chama. O cliente antigo usa o retorno por NOME de
-- coluna (PostgREST devolve json), então uma coluna a mais não quebra nada —
-- ele simplesmente ignora. Pode ser aplicada antes do push.

-- ───────────────────── 1. o tipo ganha o campo ─────────────────────
-- No fim, e não no meio: add attribute só acrescenta no fim, e a ordem das
-- colunas do tipo TEM de bater com a ordem do select das funções abaixo.
-- Trocar a posição obrigaria a recriar o tipo inteiro, com todas as funções
-- que o devolvem junto.
--
-- cascade porque o tipo é usado como retorno de função; sem ele o Postgres
-- recusa quando existe qualquer dependência.
do $$
begin
  if not exists (
    select 1 from pg_attribute a
     where a.attrelid = 'public.perfil_publico'::regclass
       and a.attname = 'verificado'
       and not a.attisdropped
  ) then
    alter type public.perfil_publico add attribute verificado boolean cascade;
  end if;
end;
$$;

comment on type public.perfil_publico is
  'O que uma pessoa pode ver de outra. Tudo aqui é público para quem recebe a linha: '
  'não acrescentar campo sem decidir que ele pode ser visto por qualquer pessoa da fila.';

-- ───────────────────── 2. as duas funções que devolvem o tipo ─────────────────────
-- Corpos copiados das ÚLTIMAS migrations que definem cada uma (fila_descobrir
-- da 0015, perfil_do_match da 0017) com uma linha a mais no select, conferido
-- por diff contra a versão em vigor. Recriar é obrigatório: o select tinha 16
-- colunas e o tipo passou a ter 17, e o Postgres recusaria a chamada com
-- "returned record type does not match".
--
-- verificacao_status = 'aprovada' e não o texto cru: 'pendente' e 'rejeitada'
-- são assunto entre a pessoa e a moderação, e não têm por que sair daqui.
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
    o.bebida, o.atividade, o.filhos, o.status_relacionamento, o.altura_m,
    o.verificacao_status = 'aprovada'
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
    o.bebida, o.atividade, o.filhos, o.status_relacionamento, o.altura_m,
    o.verificacao_status = 'aprovada'
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
