-- Lovi — colunas que só o servidor escreve
--
-- A RLS do Lovi decide QUAIS LINHAS cada pessoa pode mexer, mas não QUAIS
-- COLUNAS. As policies de escrita (profiles_atualiza_propria, photos_proprias,
-- verificacoes_insere_propria, reports_insere_proprio, consents_insere_proprio,
-- messages_marca_lida) só conferem o dono da linha, e o Supabase concede
-- INSERT/UPDATE em todas as colunas ao papel authenticated.
--
-- Reproduzido num Postgres local com as migrations 0001–0009: qualquer pessoa
-- logada, chamando a API REST direto (sem passar pelo app), conseguia
--   * se marcar como verificada (profiles.verificacao_status) e marcar o
--     próprio telefone como verificado (profiles.telefone_verificado);
--   * inserir uma verificação já 'aprovada', ou apontando para a selfie de
--     outra pessoa;
--   * reverter para 'aprovada' uma foto que a moderação tinha rejeitado
--     (photos.status_moderacao) — e a policy fotos_le do storage libera a foto
--     para terceiros justamente por esse campo;
--   * abrir denúncia já 'resolvida';
--   * reescrever o texto e trocar o remetente de uma mensagem RECEBIDA:
--     messages_marca_lida existia para marcar como lida, mas não limitava as
--     colunas, então servia para forjar o que a outra pessoa "disse";
--   * registrar consentimento com aceito_em retroativo.
-- Nada disso aparecia enquanto não existia moderação: sem ninguém para
-- rejeitar, ninguém tinha o que reverter. Vira problema no dia em que a
-- moderação (pendência do CLAUDE.md) começar a gravar nesses campos.
--
-- Correção: lista de colunas PERMITIDAS por tabela, com privilégio de coluna
-- do Postgres. Revoga INSERT/UPDATE da tabela inteira e concede só as colunas
-- que o app grava de fato. É lista de permitidas, não de proibidas, de
-- propósito: coluna nova nasce SOMENTE-LEITURA para o cliente. A futura
-- profiles.status_moderacao, por exemplo, já nasce protegida; para liberar
-- uma coluna ao cliente é preciso um grant explícito numa migration.
--
-- Não são afetados: service_role (Edge Functions e scripts) e funções
-- security definer, que rodam com os privilégios de quem as criou.
-- SELECT continua igual em todas as tabelas.

-- ───────────────────────── profiles ─────────────────────────
-- Ninguém insere perfil pelo cliente: ele nasce no trigger on_auth_user_created.
drop policy if exists profiles_insere_propria on public.profiles;
revoke insert on public.profiles from authenticated;

-- localizacao* fica de fora de propósito: só entra pelos RPCs
-- atualizar_localizacao e usar_localizacao_da_cidade. verificacao_status,
-- telefone_verificado, criado_em e atualizado_em também são do servidor.
revoke update on public.profiles from authenticated;
grant update (
  nome, telefone, data_nascimento, bio, genero, cidade, profissao, altura_m,
  status_relacionamento, intencao, bebida, atividade, filhos,
  visivel, mostrar_distancia, onboarding_completo
) on public.profiles to authenticated;

-- O cliente gravava telefone_verificado = false junto com o telefone novo.
-- Sem permissão nessa coluna, a regra "telefone trocado deixa de ser
-- verificado" passa para o banco. A regra é sempre zerar, mesmo que quem
-- escreve informe outro valor: um trigger BEFORE UPDATE não distingue "o valor
-- foi informado" de "não foi" quando o antigo já era true, e uma exceção
-- aqui seria justamente o furo. Verificar um número é uma etapa separada, que
-- o servidor faz depois, sobre o telefone já gravado.
create or replace function public.tg_telefone_novo_nao_verificado()
returns trigger language plpgsql as $$
begin
  if new.telefone is distinct from old.telefone then
    new.telefone_verificado := false;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_telefone_reverifica on public.profiles;
create trigger profiles_telefone_reverifica
  before update on public.profiles
  for each row execute function public.tg_telefone_novo_nao_verificado();

comment on column public.profiles.verificacao_status is
  'Só o servidor escreve: RPC solicitar_verificacao (pendente) e service_role (aprovada/rejeitada).';
comment on column public.profiles.telefone_verificado is
  'Só o servidor escreve. Trocar o telefone volta para false (trigger profiles_telefone_reverifica).';

-- ───────────────────────── photos ─────────────────────────
-- status_moderacao, criado_em e id ficam com o default; user_id e
-- storage_path só existem na criação (o update não os altera).
revoke insert, update on public.photos from authenticated;
grant insert (user_id, storage_path, ordem, principal) on public.photos to authenticated;
grant update (ordem, principal) on public.photos to authenticated;

comment on column public.photos.status_moderacao is
  'Só o servidor escreve. Decide se terceiros veem a foto (foto_aprovada / fotos_le).';

-- ─────────────────────── verificacoes ───────────────────────
-- Antes o cliente inseria a linha e depois atualizava o perfil, em duas
-- chamadas soltas: dava para inserir já 'aprovada' e a segunda falhar deixava
-- as duas tabelas discordando. Agora é uma função só, atômica, e o caminho da
-- selfie precisa estar na pasta da própria pessoa (mesma regra do bucket).
drop policy if exists verificacoes_insere_propria on public.verificacoes;
revoke insert on public.verificacoes from authenticated;

create or replace function public.solicitar_verificacao(p_selfie_path text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Sua sessão expirou. Entre de novo.';
  end if;

  if p_selfie_path is null or p_selfie_path not like v_uid::text || '/%' then
    raise exception 'Arquivo de verificação inválido.';
  end if;

  insert into public.verificacoes (user_id, selfie_path)
  values (v_uid, p_selfie_path);

  update public.profiles
     set verificacao_status = 'pendente'
   where id = v_uid;
end;
$$;

revoke all on function public.solicitar_verificacao(text) from public, anon;
grant execute on function public.solicitar_verificacao(text) to authenticated;

comment on column public.verificacoes.status is
  'Só o servidor escreve: nasce pendente pelo RPC solicitar_verificacao; análise via service_role.';

-- ───────────────────────── reports ─────────────────────────
-- status e criado_em ficam com o default: denúncia nasce 'aberta'.
revoke insert on public.reports from authenticated;
grant insert (denunciante_id, denunciado_id, motivo, descricao) on public.reports to authenticated;

comment on column public.reports.status is
  'Só o servidor escreve. Nasce aberta; a moderação (service_role) move para em_analise/resolvida.';

-- ───────────────────────── consents ─────────────────────────
-- aceito_em é carimbado pelo banco: é a prova do consentimento (LGPD) e não
-- pode ser escolhida por quem consente.
revoke insert on public.consents from authenticated;
grant insert (user_id, tipo, versao) on public.consents to authenticated;

-- ───────────────────────── messages ─────────────────────────
-- Marcar como lida já é feito por public.marcar_mensagens_lidas (security
-- definer, só toca lida_em) — é o único caminho que o app usa. A policy de
-- UPDATE direto era um segundo caminho, sem limite de colunas.
drop policy if exists messages_marca_lida on public.messages;
revoke update on public.messages from authenticated;

-- criado_em, lida_em e id ficam com o default.
revoke insert on public.messages from authenticated;
grant insert (match_id, sender_id, conteudo) on public.messages to authenticated;
