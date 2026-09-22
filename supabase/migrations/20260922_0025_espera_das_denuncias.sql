-- Lovi — há quanto tempo a denúncia mais antiga espera
--
-- Não existe aviso de denúncia nova (o e-mail depende de SMTP próprio no
-- Supabase Auth, que ficou para depois). O painel mostrava só QUANTAS
-- denúncias estavam abertas, no selo da aba Moderação. Só o número não diz
-- se há pressa: três denúncias de dez minutos e uma de dois dias pedem coisas
-- diferentes, e a App Store exige, para app de namoro, resposta à denúncia em
-- 24 horas. Agora o painel sabe há quanto tempo a mais antiga espera e
-- destaca quando passa do prazo.
--
-- Função nova, e não painel_denuncias_abertas com retorno trocado: o cliente
-- antigo chama aquela e espera um inteiro. Ela fica; o cliente novo usa esta.
--
-- Como as outras funções do painel: confere is_admin() e devolve só números.
-- "Aberta" é o mesmo critério de painel_denuncias_abertas e painel_moderacao
-- (status <> 'resolvida', o que inclui 'em_analise'): o selo e a fila não
-- podem discordar. Em minutos, e não um timestamp: a conta é feita com o
-- relógio do banco, e o do computador de quem abre o painel pode estar errado.
--
-- Ordem do deploy: só acrescenta. Aplicar ANTES do push — o cliente novo
-- chama esta função ao abrir o painel.
create or replace function public.painel_espera_das_denuncias()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel admin.' using errcode = '42501';
  end if;

  return (
    select jsonb_build_object(
      'abertas', count(*)::int,
      -- null quando não há nenhuma aberta
      'minutos_da_mais_antiga',
        floor(extract(epoch from now() - min(criado_em)) / 60)::int
    )
    from public.reports
    where status <> 'resolvida'
  );
end;
$$;

revoke all on function public.painel_espera_das_denuncias() from public, anon;
grant execute on function public.painel_espera_das_denuncias() to authenticated;
