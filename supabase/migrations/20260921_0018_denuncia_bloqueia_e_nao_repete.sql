-- Lovi — denunciar bloqueia, e não dá para denunciar a mesma pessoa duas vezes
--
-- Achado pelo Lu testando com duas contas (21/09): Luciano F. e Juliana deram
-- match, Luciano denunciou Juliana pelo chat. A denúncia chegou ao painel, mas
-- a conversa continuou aberta, os dois seguiam podendo escrever, e o botão de
-- denunciar continuava lá — dava para abrir a MESMA denúncia quantas vezes
-- quisesse, e a fila de moderação enchia de cópias do mesmo caso.
--
-- A 0017 tratou denunciar como "tira da fila, mas não bloqueia", conforme
-- decidido na hora. Vendo funcionar, a regra não se sustenta: quem denuncia
-- alguém no meio de uma conversa quer que aquela conversa pare. Continuar
-- recebendo mensagem de quem acabou de ser denunciado é o pior momento
-- possível para o app não fazer nada.
--
-- Regra nova, uma só e válida em qualquer lugar de onde se denuncie:
-- DENUNCIAR BLOQUEIA. A pessoa some da fila, a conversa sai da lista dos dois
-- lados (meus_matches já ignora pares com bloqueio) e ninguém mais escreve
-- (messages_envia idem). Nada é apagado: as mensagens continuam no banco, e a
-- cópia dentro da denúncia continua sendo a prova. Desbloquear está nos
-- Ajustes, como sempre esteve — mas o perfil não volta para a fila, porque a
-- 0017 pula quem você já denunciou.
--
-- Para quem foi denunciado nada revela a denúncia: o que ela vê é exatamente o
-- que veria num bloqueio comum, que já existia antes.

-- ───────── 1. as duplicatas que já entraram ─────────
-- As denúncias repetidas do teste saem da fila, mas NÃO são apagadas: viram
-- resolvidas como "arquivada", sem responsável, e ficam visíveis na aba
-- Resolvidas. Nenhum caso se perde — a denúncia mais antiga de cada par
-- continua aberta, esperando decisão.
update public.reports r
   set status = 'resolvida',
       resolucao = 'arquivada',
       analisado_em = now()
 where r.status <> 'resolvida'
   -- Com = e não "is not distinct from": denúncia de quem já excluiu a conta
   -- fica com denunciante_id nulo, e nulo não é igual a nulo. Duas pessoas
   -- diferentes que sumiram não viram a mesma denúncia. É também o que o
   -- índice abaixo faz, que trata nulos como distintos.
   and r.denunciante_id is not null
   and r.denunciado_id is not null
   and exists (
     select 1 from public.reports anterior
      where anterior.status <> 'resolvida'
        and anterior.denunciante_id = r.denunciante_id
        and anterior.denunciado_id = r.denunciado_id
        and (anterior.criado_em, anterior.id) < (r.criado_em, r.id)
   );

-- Trava no banco, não só na função: uma denúncia aberta por par. Resolvida a
-- primeira, uma nova pode ser aberta — um caso novo merece denúncia nova.
create unique index if not exists reports_uma_aberta_por_par
  on public.reports (denunciante_id, denunciado_id)
  where status <> 'resolvida';

-- ───────── 2. a função ─────────
-- Passa a devolver jsonb (antes era void) para a tela saber se a denúncia é
-- nova ou se já havia uma em análise, e dizer a coisa certa. Trocar o tipo de
-- retorno exige derrubar a função antes; o cliente antigo ignora o retorno e
-- segue funcionando, então esta migration pode ser aplicada a qualquer
-- momento.
drop function if exists public.denunciar(uuid, text, text);

create or replace function public.denunciar(
  p_denunciado uuid,
  p_motivo     text,
  p_descricao  text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_report uuid;
  v_match  uuid;
begin
  if v_uid is null then
    raise exception 'Sua sessão expirou. Entre de novo.';
  end if;
  if p_denunciado is null or p_denunciado = v_uid then
    raise exception 'Denúncia inválida.';
  end if;
  if p_motivo is null or btrim(p_motivo) = '' then
    raise exception 'Escolha um motivo para a denúncia.';
  end if;
  if not exists (select 1 from public.profiles where id = p_denunciado) then
    raise exception 'Perfil não encontrado.';
  end if;

  -- Bloqueia sempre, inclusive quando a denúncia é repetida: se a primeira
  -- falhou em bloquear (ou a pessoa desbloqueou e se arrependeu), denunciar de
  -- novo tem de cortar o contato do mesmo jeito. O gatilho blocks_desativa_match
  -- desativa o match; as mensagens ficam onde estão.
  insert into public.blocks (bloqueador_id, bloqueado_id)
  values (v_uid, p_denunciado)
  on conflict (bloqueador_id, bloqueado_id) do nothing;

  -- Já denunciou essa pessoa e ainda não houve decisão? Então não abre outra:
  -- a moderação leria o mesmo caso várias vezes, e a fila mostraria a mesma
  -- pessoa repetida esperando a mesma decisão.
  select id into v_report
    from public.reports
   where denunciante_id = v_uid
     and denunciado_id = p_denunciado
     and status <> 'resolvida'
   limit 1;

  if v_report is not null then
    return jsonb_build_object('nova', false);
  end if;

  insert into public.reports (denunciante_id, denunciado_id, motivo, descricao,
                              denunciado_nome, conversa_copiada)
  select v_uid, p.id, btrim(p_motivo),
         nullif(btrim(coalesce(p_descricao, '')), ''), p.nome, true
    from public.profiles p
   where p.id = p_denunciado
  returning id into v_report;

  -- O match pode estar desfeito, finalizado ou recém-desativado pelo bloqueio
  -- acima: a conversa que houve interessa do mesmo jeito. Denúncia aberta a
  -- partir da fila não tem conversa nenhuma, e aí a cópia fica vazia
  -- (conversa_copiada segue true, para a tela saber a diferença entre "não
  -- houve conversa" e "denúncia antiga, sem cópia").
  select m.id into v_match
    from public.matches m
   where m.user_a = least(v_uid, p_denunciado)
     and m.user_b = greatest(v_uid, p_denunciado);

  if v_match is not null then
    insert into public.report_mensagens (report_id, autor, conteudo, enviada_em, ordem)
    select v_report,
           case when ultimas.sender_id = v_uid then 'denunciante' else 'denunciado' end,
           ultimas.conteudo,
           ultimas.criado_em,
           row_number() over (order by ultimas.criado_em)
      from (select msg.sender_id, msg.conteudo, msg.criado_em
              from public.messages msg
             where msg.match_id = v_match
             order by msg.criado_em desc
             limit 200) ultimas;
  end if;

  return jsonb_build_object('nova', true);
end;
$$;

revoke all on function public.denunciar(uuid, text, text) from public, anon;
grant execute on function public.denunciar(uuid, text, text) to authenticated;
