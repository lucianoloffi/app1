-- Lovi — a denúncia passa a entrar só pelo RPC
--
-- Separada da 0015 por causa da ordem do deploy: a 0015 só adiciona e pode ser
-- aplicada ANTES do push; esta TIRA uma permissão que o cliente antigo usa
-- (insert direto em reports) e precisa ser aplicada LOGO DEPOIS do deploy.
--
-- Entre a 0015 e o deploy os dois caminhos funcionam: o app antigo insere
-- direto (e a denúncia fica sem cópia da conversa), o app novo chama
-- public.denunciar. Depois desta migration só o RPC entra — que é o que
-- garante que TODA denúncia nasça com a cópia da conversa junto.

drop policy if exists reports_insere_proprio on public.reports;
revoke insert on public.reports from authenticated;

comment on table public.reports is
  'Denúncias. O app não escreve direto: entra pelo RPC public.denunciar, que copia a conversa junto.';
