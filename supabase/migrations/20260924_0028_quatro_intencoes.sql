-- Intenção troca de opções: sai 'amizade', entram 'casual' e 'nao_sei'.
--
-- Antes: 'serio', 'conhecer', 'amizade'.
-- Agora: 'serio' (Relacionamento sério), 'conhecer' (Conhecer alguém),
--        'casual' (Algo casual), 'nao_sei' (Ainda não sei).
--
-- 'serio' e 'conhecer' continuam com a mesma chave: o sentido não mudou, só o
-- rótulo de 'conhecer' ("Conhecer pessoas" → "Conhecer alguém"). 'amizade'
-- deixa de existir e vira 'conhecer', a opção que sobra mais próxima: sem
-- pressa, ver no que dá. Nem 'casual' nem 'nao_sei' dizem o que quem escolheu
-- amizade quis dizer.
--
-- No filtro, quem tinha as três marcadas passa a ter as quatro — marcar tudo
-- sempre quis dizer "não filtrar", e deixar as novas de fora esconderia de
-- quem nunca escolheu isso justamente as pessoas que chegarem depois. Quem
-- tinha um recorte fica com o mesmo recorte, com 'amizade' trocada por
-- 'conhecer' (sem repetir, se já estava lá).
--
-- Nenhuma função precisa mudar: fila_descobrir e distancia_do_mais_proximo
-- comparam com `o.intencao = any(eu.intencao_filtro)`, sem lista fixa.

-- 1. profiles.intencao ----------------------------------------------------
-- A restrição nasceu sem nome na 0001; acha-se pelo conteúdo, como na 0008.
do $$
declare
  nome_da_restricao text;
begin
  for nome_da_restricao in
    select conname
      from pg_constraint
     where conrelid = 'public.profiles'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) like '%intencao%'
  loop
    execute format('alter table public.profiles drop constraint %I', nome_da_restricao);
  end loop;
end $$;

update public.profiles set intencao = 'conhecer' where intencao = 'amizade';

alter table public.profiles
  add constraint profiles_intencao_check
  check (intencao in ('serio','conhecer','casual','nao_sei'));

-- 2. profile_preferences.intencao_filtro ---------------------------------
alter table public.profile_preferences
  drop constraint if exists profile_preferences_intencao_filtro_check;

update public.profile_preferences
   set intencao_filtro = case
     when intencao_filtro @> array['serio','conhecer','amizade']
       then array['serio','conhecer','casual','nao_sei']
     else array(
       select distinct x
         from unnest(array_replace(intencao_filtro, 'amizade', 'conhecer')) as x
     )
   end;

alter table public.profile_preferences
  alter column intencao_filtro set default array['serio','conhecer','casual','nao_sei'];

-- Pelo menos uma intenção, e só as que as telas oferecem. Vazio deixaria a
-- fila sempre sem ninguém, sem a pessoa entender por quê.
alter table public.profile_preferences
  add constraint profile_preferences_intencao_filtro_check
  check (
    array_length(intencao_filtro, 1) between 1 and 4
    and intencao_filtro <@ array['serio','conhecer','casual','nao_sei']
  );

comment on column public.profile_preferences.intencao_filtro is
  'Intenções aceitas na fila. Marcar as quatro equivale a não filtrar.';
