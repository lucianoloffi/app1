-- Lovi — "Prefiro não dizer" passa a ser resposta
--
-- Na tela Interesses, bebida, atividade física, filhos, fumo e status de
-- relacionamento têm a opção "Prefiro não dizer". Até aqui ela gravava null,
-- o mesmo que nunca ter respondido. Com isso:
--   · o anel de completude do Perfil nunca chegava a 100% para quem a
--     escolhia, e não dizia o que faltava;
--   · a folha mostrava "Prefiro não dizer" em toda pergunta nunca aberta,
--     como se a pessoa tivesse escolhido.
--
-- Uma coluna à parte, e não um valor novo em cada check: assim bebida, fumo &
-- cia. continuam com as mesmas chaves (nada muda em types.ts, nas frases do
-- perfil nem nas funções da fila), e a recusa fica só com a dona. A coluna não
-- entra no perfil_publico: para os outros, recusar e não responder continuam
-- iguais — não aparece nada.
--
-- Os nomes são os dos campos no app (src/types.ts, CampoQuePodeRecusar).
-- Quem já tinha escolhido "Prefiro não dizer" antes desta migration continua
-- como não respondido: o banco não tem como saber qual null era escolha.

alter table public.profiles
  add column if not exists prefere_nao_dizer text[] not null default '{}';

alter table public.profiles drop constraint if exists profiles_prefere_nao_dizer_check;
alter table public.profiles
  add constraint profiles_prefere_nao_dizer_check
  check (prefere_nao_dizer <@ array['bebida','atividade','filhos','fumo','relacionamento']::text[]);

comment on column public.profiles.prefere_nao_dizer is
  'Perguntas em que a pessoa escolheu "Prefiro não dizer" (o campo fica null). Só a dona lê.';

-- Coluna nova nasce somente-leitura (0010). Esta é escolha da própria pessoa.
grant update (prefere_nao_dizer) on public.profiles to authenticated;
