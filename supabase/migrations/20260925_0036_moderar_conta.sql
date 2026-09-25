-- Lovi — painel admin, suspender e banir pela aba Usuários
--
-- A moderar (0015) recebe uma denúncia: é a decisão sobre ela, e sanciona
-- quem foi denunciado. Pela aba Usuários não há denúncia nenhuma: o perfil
-- impróprio que ninguém denunciou é justamente o motivo da aba existir.
-- moderar_conta decide sobre a conta direto, com as mesmas três ações que
-- mexem nela (suspender, banir, reativar) e o mesmo efeito em profiles: a
-- sanção morde nos mesmos lugares (fila, swipes, mensagens, 0015/0017),
-- porque todos leem profiles.status_moderacao.
--
-- De propósito, diferente da moderar:
--   · não resolve as denúncias abertas contra a pessoa. Quem decide pela
--     lista pode não ter lido nenhuma, e uma denúncia pode pedir mais do que
--     a suspensão aplicada. Elas continuam na fila de Moderação (a tela avisa
--     antes de confirmar);
--   · recusa moderar a própria conta: um toque errado trancaria o admin fora
--     do app, e o painel não teria como desfazer por ele.
--
-- Registra em admin_actions como a moderar, com report_id nulo: a decisão
-- não veio de denúncia. A constraint de acao já aceita as três (0021).

create or replace function public.moderar_conta(p_user_id uuid, p_acao text, p_dias int default 7)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin  uuid := auth.uid();
  v_email  text;
  v_nome   text;
  v_status text;
  v_ate    timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel admin.' using errcode = '42501';
  end if;
  if p_acao not in ('suspender','banir','reativar') then
    raise exception 'Ação inválida.';
  end if;
  if p_acao = 'suspender' and (p_dias is null or p_dias < 1 or p_dias > 365) then
    raise exception 'A suspensão precisa ser de 1 a 365 dias.';
  end if;
  if p_user_id = v_admin then
    raise exception 'Não dá para moderar a própria conta.';
  end if;

  select coalesce(nullif(btrim(coalesce(p.nome, '')), ''), 'Sem nome')
    into v_nome
    from public.profiles p
   where p.id = p_user_id;
  if not found then
    raise exception 'A conta não existe mais.';
  end if;

  select u.email into v_email from auth.users u where u.id = v_admin;

  v_status := case p_acao when 'suspender' then 'suspenso'
                          when 'banir'     then 'banido'
                          else 'ativo' end;
  v_ate := case when p_acao = 'suspender' then now() + make_interval(days => p_dias) end;

  update public.profiles
     set status_moderacao = v_status,
         suspensao_termina_em = v_ate,
         moderacao_atualizada_em = now()
   where id = p_user_id;

  insert into public.admin_actions (admin_id, admin_email, acao, report_id,
                                    alvo_id, alvo_nome, detalhe)
  values (v_admin, coalesce(v_email, 'desconhecido'), p_acao, null,
          p_user_id, v_nome,
          case when p_acao = 'suspender' then p_dias::text || ' dias' end);

  return jsonb_build_object('acao', p_acao, 'nome', v_nome, 'termina_em', v_ate);
end;
$$;

revoke all on function public.moderar_conta(uuid, text, int) from public, anon;
grant execute on function public.moderar_conta(uuid, text, int) to authenticated;
