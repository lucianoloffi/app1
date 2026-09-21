-- Lovi — devolver o telefone a quem o perdeu no fim do cadastro
--
-- O telefone é gravado na criação da conta: vai nos metadados do signUp e o
-- gatilho tg_novo_usuario copia para profiles.telefone. Mas concluirCadastro,
-- no fim do cadastro, gravava de novo o telefone que estava na tela — e quando
-- o cadastro é retomado depois de confirmar o e-mail (o caminho normal), esse
-- valor chega vazio. Resultado: quem confirmou o e-mail ficou sem telefone no
-- perfil, e a tela "Trocar número" mostrava "Nenhum número salvo".
--
-- O cliente deixou de gravar o telefone no fim do cadastro. Aqui, os perfis
-- que ficaram sem número recebem de volta o que foi informado na criação da
-- conta, que continua nos metadados do auth. Só preenche quem está vazio:
-- quem já trocou o número pela tela não é tocado. Pode rodar mais de uma vez.
update public.profiles p
   set telefone = u.raw_user_meta_data ->> 'telefone'
  from auth.users u
 where u.id = p.id
   and coalesce(btrim(p.telefone), '') = ''
   and coalesce(btrim(u.raw_user_meta_data ->> 'telefone'), '') <> '';

-- Security Advisor: "Public/Signed-In Users Can Execute SECURITY DEFINER
-- Function" nas três funções de gatilho. Ninguém consegue chamá-las por fora
-- (o Postgres recusa chamar função de gatilho fora de um gatilho), então não
-- era brecha; tirar a permissão só limpa o aviso. O gatilho continua
-- disparando: a permissão de executar é conferida quando o gatilho é criado,
-- não a cada disparo.
revoke execute on function public.tg_novo_usuario()         from public, anon, authenticated;
revoke execute on function public.tg_match_por_curtida()    from public, anon, authenticated;
revoke execute on function public.tg_block_desativa_match() from public, anon, authenticated;
