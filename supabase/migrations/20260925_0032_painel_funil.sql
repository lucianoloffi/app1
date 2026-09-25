-- Lovi — painel admin, funil de quem entra no app
--
-- Na fase de testes, com pouca gente, a pergunta que importa é onde as pessoas
-- param: terminam o cadastro? Curtem alguém? Dão match? Conversam? Os marcos
-- de cada etapa já são gravados desde a 0013 (marcos_do_usuario); faltava
-- consultar.
--
-- Quem entra: as contas CRIADAS no período (dia de São Paulo), acompanhadas
-- etapa por etapa até hoje. Não é "quem curtiu no período": misturar gente que
-- entrou em momentos diferentes esconde onde está o buraco.
--
-- Fora da conta: os perfis de teste do `npm run popular` (e-mail @lovi.test,
-- o DOMINIO_PADRAO de scripts/popular-perfis.mjs) e as contas de admin. Com
-- vinte pessoas reais, os vinte perfis de teste dobrariam o topo do funil.
-- Conta excluída também não aparece: excluir apaga o perfil e os marcos.
--
-- "Conversaram" é ter um match em que alguém escreveu; "Tiveram resposta", um
-- match em que os dois escreveram. São os marcos primeira_conversa_em e
-- primeira_resposta_em da 0013, que valem para os dois lados do match.
--
-- Como painel_numeros (0014): só números somados, e recusa quem não é admin.

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
    select d.id, d.onboarding_completo, m.*
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
    'fora_da_conta', (select count(*) from do_periodo where de_fora)
  ) into v_res;

  return v_res;
end;
$$;

revoke all on function public.painel_funil(text) from public, anon;
grant execute on function public.painel_funil(text) to authenticated;
