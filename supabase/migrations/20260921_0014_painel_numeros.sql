-- Lovi — painel admin, tela de Números (V0)
--
-- Quem é admin: raw_app_meta_data.papel = 'admin' em auth.users. app_metadata
-- e não user_metadata: user_metadata o próprio usuário altera pela API
-- (auth.updateUser), app_metadata só o servidor. Marcar alguém é um update
-- feito à mão no SQL Editor (ver SETUP.md).
--
-- is_admin() lê auth.users na hora, em vez do app_metadata que vem dentro do
-- token de login: o token só é renovado de hora em hora, então marcar ou
-- desmarcar alguém levaria até uma hora para valer. Aqui vale na próxima
-- chamada.
--
-- painel_numeros() devolve só números somados, nunca uma lista de pessoas. E
-- recusa quem não é admin: o painel tem um endereço público, quem protege os
-- dados é esta checagem.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select (u.raw_app_meta_data ->> 'papel') = 'admin' from auth.users u where u.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- p_periodo: 'hoje', '7d', '30d' ou '90d', sempre terminando hoje (dia de São
-- Paulo). O gráfico é sempre dos últimos 30 dias, seja qual for o período.
create or replace function public.painel_numeros(p_periodo text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_fim  date := public.dia_local(now());
  v_dias integer;
  v_ini  date;
  v_res  jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel admin.' using errcode = '42501';
  end if;

  v_dias := case p_periodo when 'hoje' then 1 when '7d' then 7 when '30d' then 30 when '90d' then 90 end;
  if v_dias is null then
    raise exception 'Período inválido.';
  end if;
  v_ini := v_fim - (v_dias - 1);

  with ativos as (
    select distinct user_id from public.atividade_diaria where dia between v_ini and v_fim
  ),
  matches_do_periodo as (
    select * from public.historico_matches
     where public.dia_local(criado_em) between v_ini and v_fim
  ),
  dias as (
    select d::date as dia from generate_series(v_fim - 29, v_fim, interval '1 day') d
  ),
  novos_por_dia as (
    select public.dia_local(criado_em) as dia, count(*) as n
      from public.profiles
     where public.dia_local(criado_em) >= v_fim - 29
     group by 1
  ),
  ativos_por_dia as (
    select dia, count(*) as n from public.atividade_diaria
     where dia >= v_fim - 29
     group by dia
  ),
  cidades as (
    select p.cidade,
           count(*)                                     as usuarios,
           count(*) filter (where p.genero = 'homem')   as homens,
           count(*) filter (where p.genero = 'mulher')  as mulheres,
           count(*) filter (where p.genero is distinct from 'homem'
                              and p.genero is distinct from 'mulher') as outros
      from ativos a
      join public.profiles p on p.id = a.user_id
     where p.cidade is not null
     group by p.cidade
     order by count(*) desc, p.cidade
     limit 5
  )
  select jsonb_build_object(
    'inicio', v_ini,
    'fim', v_fim,
    'novos_usuarios', (select count(*) from public.profiles
                        where public.dia_local(criado_em) between v_ini and v_fim),
    'ativos', (select count(*) from ativos),
    'ativos_hoje', (select count(*) from public.atividade_diaria where dia = v_fim),
    'ativos_com_match', (select count(*) from ativos a
                          where exists (select 1 from matches_do_periodo m
                                         where a.user_id in (m.user_a, m.user_b))),
    'matches', (select count(*) from matches_do_periodo),
    'matches_com_conversa', (select count(*) from matches_do_periodo
                              where primeira_mensagem_em is not null),
    'por_dia', (select jsonb_agg(jsonb_build_object(
                         'dia', d.dia,
                         'novos', coalesce(n.n, 0),
                         'ativos', coalesce(a.n, 0)) order by d.dia)
                  from dias d
                  left join novos_por_dia n on n.dia = d.dia
                  left join ativos_por_dia a on a.dia = d.dia),
    'cidades', (select coalesce(jsonb_agg(jsonb_build_object(
                         'cidade', c.cidade, 'usuarios', c.usuarios, 'homens', c.homens,
                         'mulheres', c.mulheres, 'outros', c.outros)
                         order by c.usuarios desc, c.cidade), '[]'::jsonb)
                  from cidades c)
  ) into v_res;

  return v_res;
end;
$$;

revoke all on function public.painel_numeros(text) from public, anon;
grant execute on function public.painel_numeros(text) to authenticated;
