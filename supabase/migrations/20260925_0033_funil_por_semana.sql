-- Lovi — painel admin, funil semana a semana
--
-- O funil da 0032 mostrava só o período inteiro, e não dava para ver se o app
-- estava melhorando. painel_funil passa a devolver também as semanas de
-- entrada: as contas criadas em cada semana (segunda a domingo, dia de São
-- Paulo) e até onde cada grupo chegou. O painel mostra, por semana, quantos
-- deram match.
--
-- Corpo copiado da 0032 (a última que define painel_funil) e conferido por
-- diff: a nova é a antiga mais a coluna "semana" na coorte e o campo
-- "semanas" no resultado, nada além. Os grants continuam os mesmos.

create or replace function public.painel_funil(p_periodo text)
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

  with do_periodo as (
    select p.id, p.onboarding_completo,
           date_trunc('week', public.dia_local(p.criado_em))::date as semana,
           -- coalesce: quem não é admin não tem 'papel', e "falso ou nulo" é
           -- nulo, não falso. Sem ele, "not de_fora" descartava todas as
           -- contas de verdade (conferido na primeira versão: funil zerado).
           coalesce(u.email ilike '%@lovi.test', false)
             or coalesce(u.raw_app_meta_data ->> 'papel' = 'admin', false) as de_fora
      from public.profiles p
      join auth.users u on u.id = p.id
     where public.dia_local(p.criado_em) between v_ini and v_fim
  ),
  coorte as (
    select d.id, d.onboarding_completo, d.semana, m.*
      from do_periodo d
      left join public.marcos_do_usuario m on m.user_id = d.id
     where not d.de_fora
  )
  select jsonb_build_object(
    'inicio', v_ini,
    'fim', v_fim,
    'contas', (select count(*) from coorte),
    'cadastro', (select count(*) from coorte
                  where cadastro_concluido_em is not null or onboarding_completo),
    'curtida', (select count(*) from coorte where primeira_curtida_em is not null),
    'match', (select count(*) from coorte where primeiro_match_em is not null),
    'conversa', (select count(*) from coorte where primeira_conversa_em is not null),
    'resposta', (select count(*) from coorte where primeira_resposta_em is not null),
    'fora_da_conta', (select count(*) from do_periodo where de_fora),
    'semanas', (select coalesce(jsonb_agg(jsonb_build_object(
                         'semana', s.semana, 'contas', s.contas, 'cadastro', s.cadastro,
                         'curtida', s.curtida, 'match', s.match,
                         'conversa', s.conversa, 'resposta', s.resposta)
                         order by s.semana), '[]'::jsonb)
                  from (select semana,
                               count(*) as contas,
                               count(*) filter (where cadastro_concluido_em is not null
                                                   or onboarding_completo) as cadastro,
                               count(primeira_curtida_em)  as curtida,
                               count(primeiro_match_em)    as match,
                               count(primeira_conversa_em) as conversa,
                               count(primeira_resposta_em) as resposta
                          from coorte
                         group by semana) s)
  ) into v_res;

  return v_res;
end;
$$;

revoke all on function public.painel_funil(text) from public, anon;
grant execute on function public.painel_funil(text) to authenticated;
