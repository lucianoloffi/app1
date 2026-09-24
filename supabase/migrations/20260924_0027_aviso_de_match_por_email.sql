-- 0027 — E-mail de aviso quando nasce um match.
--
-- Os interruptores "Novos matches" e "Mensagens" existem em Ajustes desde a
-- 0001 (settings.notif_match, notif_mensagem), mas nada era enviado: quem não
-- estava com o app aberto só descobria o match se voltasse por conta própria.
--
-- O caminho: um gatilho em matches chama a Edge Function `avisar-match` pelo
-- pg_net, passando SÓ o id do match. Quem decide quem recebe é
-- `destinatarios_do_aviso_de_match`, aqui no banco, chamada pela função com
-- service role. Mandar os e-mails no corpo da chamada faria da função um
-- disparador de e-mail para qualquer endereço nas mãos de quem descobrisse o
-- segredo; recebendo só o id, o pior que um segredo vazado faz é repetir o
-- aviso de um match que existe.
--
-- O endereço da função e o segredo ficam no Vault, não aqui: migration vai
-- para o Git. Sem os dois segredos no Vault, o gatilho não faz nada — dá para
-- aplicar esta migration antes de configurar o envio, e o match continua
-- nascendo normalmente.
--
-- Configuração (uma vez, no SQL Editor, com os valores de verdade):
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/avisar-match', 'aviso_match_url');
--   select vault.create_secret('<o mesmo AVISO_MATCH_SEGREDO da Edge Function>', 'aviso_match_segredo');

create extension if not exists pg_net;

-- Quem recebe o aviso deste match: e-mail de cada um dos dois que deixou
-- "Novos matches" ligado. Ninguém recebe quando:
--   - o match foi desfeito antes de o aviso sair;
--   - um dos dois está sob sanção — `meus_matches` esconde esse match (0017),
--     e o e-mail avisaria de um match que a pessoa não encontra no app;
--   - há bloqueio entre os dois, pelo mesmo motivo (`meus_matches` pula o par).
-- Quem nunca abriu os Ajustes não tem linha em settings: vale o padrão da
-- coluna, ligado.
create or replace function public.destinatarios_do_aviso_de_match(p_match_id uuid)
returns table (user_id uuid, email text)
language sql
security definer
stable
set search_path = public
as $$
  select u.id, u.email::text
    from public.matches m
    cross join lateral (values (m.user_a), (m.user_b)) as par(id)
    join auth.users u on u.id = par.id
    left join public.settings s on s.user_id = par.id
   where m.id = p_match_id
     and m.ativo
     and coalesce(s.notif_match, true)
     and u.email is not null
     and not exists (
       select 1
         from public.profiles p
        where p.id in (m.user_a, m.user_b)
          and public.sob_sancao(p.status_moderacao, p.suspensao_termina_em)
     )
     and not exists (
       select 1
         from public.blocks b
        where (b.bloqueador_id = m.user_a and b.bloqueado_id = m.user_b)
           or (b.bloqueador_id = m.user_b and b.bloqueado_id = m.user_a)
     );
$$;

-- Devolve e-mail de qualquer pessoa: só a Edge Function, com service role.
revoke all on function public.destinatarios_do_aviso_de_match(uuid) from public, anon, authenticated;
grant execute on function public.destinatarios_do_aviso_de_match(uuid) to service_role;

-- Dispara o aviso no mesmo momento em que o histórico conta um match
-- (tg_historico_match, 0013): linha nova, ou o mesmo par voltando a dar match
-- — tg_match_por_curtida reativa a linha existente em vez de criar outra.
--
-- O pg_net só enfileira: a chamada sai depois do commit, e some junto se a
-- transação desfizer. Qualquer falha aqui é engolida: um e-mail que não sai
-- não pode impedir o match de nascer.
create or replace function public.tg_aviso_de_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url     text;
  v_segredo text;
begin
  if tg_op = 'UPDATE' and not (new.ativo and not old.ativo) then
    return new;
  end if;

  begin
    select decrypted_secret into v_url
      from vault.decrypted_secrets where name = 'aviso_match_url';
    select decrypted_secret into v_segredo
      from vault.decrypted_secrets where name = 'aviso_match_segredo';

    if v_url is null or v_segredo is null then
      return new;
    end if;

    perform net.http_post(
      url := v_url,
      body := jsonb_build_object('match_id', new.id),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-aviso-segredo', v_segredo
      ),
      timeout_milliseconds := 10000
    );
  exception when others then
    raise warning 'aviso de match % não enfileirado: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.tg_aviso_de_match() from public, anon, authenticated;

drop trigger if exists matches_aviso_por_email on public.matches;
create trigger matches_aviso_por_email
  after insert or update of ativo on public.matches
  for each row execute function public.tg_aviso_de_match();
