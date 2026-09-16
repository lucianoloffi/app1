-- Acrescenta "casado" aos estados civis aceitos em profiles.
-- A restrição original nasceu em linha na tabela (20260915_0001_schema.sql), e o
-- nome dela foi gerado pelo Postgres; por isso procuramos pela definição em vez
-- de confiar no nome.

do $$
declare
  nome_da_restricao text;
begin
  select conname into nome_da_restricao
    from pg_constraint
   where conrelid = 'public.profiles'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%status_relacionamento%';

  if nome_da_restricao is not null then
    execute format('alter table public.profiles drop constraint %I', nome_da_restricao);
  end if;
end $$;

alter table public.profiles
  add constraint profiles_status_relacionamento_check
  check (status_relacionamento in
    ('solteiro','namorando','casado','divorciado','separado','viuvo'));
