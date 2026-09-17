-- Intenção no filtro de busca vira múltipla escolha.
--
-- Antes era uma intenção só, com 'todas' fazendo o papel de "não filtrar".
-- Com várias marcadas ao mesmo tempo, 'todas' deixa de existir: marcar as três
-- diz a mesma coisa, e de um jeito que a pessoa enxerga na tela.
--
-- A coluna troca de text para text[]. Quem tinha 'todas' passa a ter as três;
-- quem tinha uma intenção fica só com ela, que é o mesmo filtro de antes.

alter table public.profile_preferences
  drop constraint if exists profile_preferences_intencao_filtro_check;

do $$
declare
  nome_da_restricao text;
begin
  select conname into nome_da_restricao
    from pg_constraint
   where conrelid = 'public.profile_preferences'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%intencao_filtro%';

  if nome_da_restricao is not null then
    execute format(
      'alter table public.profile_preferences drop constraint %I', nome_da_restricao);
  end if;
end $$;

alter table public.profile_preferences
  alter column intencao_filtro drop default;

alter table public.profile_preferences
  alter column intencao_filtro type text[]
  using case
    when intencao_filtro = 'todas' then array['serio','conhecer','amizade']
    else array[intencao_filtro]
  end;

alter table public.profile_preferences
  alter column intencao_filtro set default array['serio','conhecer','amizade'];

-- Pelo menos uma intenção, e só as três que as telas oferecem. Vazio deixaria
-- a fila sempre sem ninguém, sem a pessoa entender por quê.
alter table public.profile_preferences
  add constraint profile_preferences_intencao_filtro_check
  check (
    array_length(intencao_filtro, 1) between 1 and 3
    and intencao_filtro <@ array['serio','conhecer','amizade']
  );

comment on column public.profile_preferences.intencao_filtro is
  'Intenções aceitas na fila. Marcar as três equivale ao antigo "todas".';

-- A fila passa a aceitar qualquer intenção da lista.
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

revoke all on function public.fila_descobrir(int, int) from public, anon;
grant execute on function public.fila_descobrir(int, int) to authenticated;
