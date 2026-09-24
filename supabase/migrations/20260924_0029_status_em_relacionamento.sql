-- Status de relacionamento: "Namorando" e "Casado(a)" viram uma opção só,
-- "Em um relacionamento".
--
-- Antes: 'solteiro','namorando','casado','divorciado','separado','viuvo'.
-- Agora: 'solteiro','separado','divorciado','viuvo','em_relacionamento'.
--
-- Quem tinha 'namorando' ou 'casado' passa a 'em_relacionamento', que diz o
-- mesmo sem o detalhe que as duas separavam. "Prefiro não dizer" continua
-- sendo o campo vazio (null), não um valor.
--
-- Nenhuma função muda: fila_descobrir e perfil_do_match devolvem a coluna como
-- está, e o app traduz a chave em texto.

-- A restrição foi recriada com nome na 0007, mas procurar pelo conteúdo, como
-- lá, não depende disso.
do $$
declare
  nome_da_restricao text;
begin
  for nome_da_restricao in
    select conname
      from pg_constraint
     where conrelid = 'public.profiles'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%status_relacionamento%'
  loop
    execute format('alter table public.profiles drop constraint %I', nome_da_restricao);
  end loop;
end $$;

update public.profiles
   set status_relacionamento = 'em_relacionamento'
 where status_relacionamento in ('namorando', 'casado');

alter table public.profiles
  add constraint profiles_status_relacionamento_check
  check (status_relacionamento in
    ('solteiro','separado','divorciado','viuvo','em_relacionamento'));
