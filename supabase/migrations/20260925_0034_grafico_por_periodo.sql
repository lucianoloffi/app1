-- Lovi — painel admin, gráfico que acompanha o filtro de período
--
-- O gráfico da aba Números mostrava sempre os últimos 30 dias, fosse qual
-- fosse o filtro, e na base só um dia a cada cinco. Agora ele segue o filtro:
--   · Hoje      → por hora, de 0h até a hora atual
--   · 7 dias    → por dia
--   · 30 dias   → por dia
--   · 90 dias   → por semana (segunda a domingo)
--
-- ── Hora de uso ──
-- atividade_diaria (0013) guarda só o DIA em que a pessoa usou o app: não dá
-- para saber quantos usaram em cada hora. registrar_atividade, que o app já
-- chama ao abrir e ao voltar para a frente, passa a gravar também a hora, em
-- atividade_por_hora: uma linha por pessoa por hora de uso. Vale daqui para
-- frente; as horas de hoje antes desta migration ficam sem ativos.
-- É "registro de acesso", que a política de privacidade já prevê (seção de
-- dados gerados pelo uso). Como atividade_diaria: só o servidor lê e escreve,
-- e excluir a conta apaga as linhas da pessoa (cascade).
--
-- ── Novos usuários ──
-- Contas criadas, como no cartão "Novos usuários" de painel_numeros (0014):
-- sem tirar os perfis de teste, para o gráfico e o cartão baterem.

create table if not exists public.atividade_por_hora (
  user_id uuid not null references public.profiles(id) on delete cascade,
  hora    timestamptz not null,
  primary key (user_id, hora)
);
create index if not exists atividade_por_hora_hora_idx on public.atividade_por_hora (hora);

alter table public.atividade_por_hora enable row level security;
revoke all on public.atividade_por_hora from anon, authenticated;

-- Corpo copiado da 0013 (a última que define registrar_atividade), mais o
-- segundo insert. Chamar de novo na mesma hora não faz nada.
create or replace function public.registrar_atividade()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.atividade_diaria (user_id, dia)
  select p.id, public.dia_local(now())
    from public.profiles p
   where p.id = auth.uid()
  on conflict do nothing;

  insert into public.atividade_por_hora (user_id, hora)
  select p.id, date_trunc('hour', now())
    from public.profiles p
   where p.id = auth.uid()
  on conflict do nothing;
$$;

revoke all on function public.registrar_atividade() from public, anon;
grant execute on function public.registrar_atividade() to authenticated;

-- Os pontos do gráfico no formato do período. Como painel_numeros (0014): só
-- números somados, e recusa quem não é admin.
-- "inicio" de cada ponto: 'AAAA-MM-DDTHH:00' (hora, em São Paulo),
-- 'AAAA-MM-DD' (dia) ou a segunda-feira da semana (semana).
create or replace function public.painel_serie(p_periodo text)
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

  if p_periodo = 'hoje' then
    with horas as (
      select generate_series(
               0, extract(hour from now() at time zone 'America/Sao_Paulo')::int
             ) as h
    ),
    novos as (
      select extract(hour from criado_em at time zone 'America/Sao_Paulo')::int as h,
             count(*) as n
        from public.profiles
       where public.dia_local(criado_em) = v_fim
       group by 1
    ),
    ativos as (
      select extract(hour from hora at time zone 'America/Sao_Paulo')::int as h,
             count(distinct user_id) as n
        from public.atividade_por_hora
       where public.dia_local(hora) = v_fim
       group by 1
    )
    select jsonb_build_object(
      'granularidade', 'hora',
      'pontos', jsonb_agg(jsonb_build_object(
                  'inicio', to_char(v_fim, 'YYYY-MM-DD') || 'T' || lpad(horas.h::text, 2, '0') || ':00',
                  'novos', coalesce(novos.n, 0),
                  'ativos', coalesce(ativos.n, 0)) order by horas.h)
    ) into v_res
      from horas
      left join novos on novos.h = horas.h
      left join ativos on ativos.h = horas.h;

  elsif p_periodo = '90d' then
    with semanas as (
      select s::date as semana
        from generate_series(date_trunc('week', v_ini), v_fim, interval '1 week') s
    ),
    novos as (
      select date_trunc('week', public.dia_local(criado_em))::date as semana, count(*) as n
        from public.profiles
       where public.dia_local(criado_em) between v_ini and v_fim
       group by 1
    ),
    ativos as (
      select date_trunc('week', dia)::date as semana, count(distinct user_id) as n
        from public.atividade_diaria
       where dia between v_ini and v_fim
       group by 1
    )
    select jsonb_build_object(
      'granularidade', 'semana',
      'pontos', jsonb_agg(jsonb_build_object(
                  'inicio', semanas.semana,
                  'novos', coalesce(novos.n, 0),
                  'ativos', coalesce(ativos.n, 0)) order by semanas.semana)
    ) into v_res
      from semanas
      left join novos on novos.semana = semanas.semana
      left join ativos on ativos.semana = semanas.semana;

  else
    with dias as (
      select d::date as dia from generate_series(v_ini, v_fim, interval '1 day') d
    ),
    novos as (
      select public.dia_local(criado_em) as dia, count(*) as n
        from public.profiles
       where public.dia_local(criado_em) between v_ini and v_fim
       group by 1
    ),
    ativos as (
      select dia, count(*) as n
        from public.atividade_diaria
       where dia between v_ini and v_fim
       group by dia
    )
    select jsonb_build_object(
      'granularidade', 'dia',
      'pontos', jsonb_agg(jsonb_build_object(
                  'inicio', dias.dia,
                  'novos', coalesce(novos.n, 0),
                  'ativos', coalesce(ativos.n, 0)) order by dias.dia)
    ) into v_res
      from dias
      left join novos on novos.dia = dias.dia
      left join ativos on ativos.dia = dias.dia;
  end if;

  return v_res;
end;
$$;

revoke all on function public.painel_serie(text) from public, anon;
grant execute on function public.painel_serie(text) to authenticated;
