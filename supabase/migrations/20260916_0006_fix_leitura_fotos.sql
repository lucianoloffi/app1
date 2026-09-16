-- Lovi — correção: fotos de terceiros não abriam
--
-- A política de leitura do bucket consultava public.photos para saber se a
-- foto estava aprovada. Só que essa consulta roda sob o RLS de public.photos,
-- que restringe cada pessoa às próprias fotos — então a condição nunca era
-- verdadeira para a foto de outra pessoa, e a URL assinada era recusada.
--
-- A checagem passa para uma função security definer, que enxerga a tabela
-- inteira mas devolve apenas um booleano: se aquele arquivo é uma foto
-- aprovada. Nada além disso vaza.

create or replace function public.foto_aprovada(p_path text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.photos p
     where p.storage_path = p_path
       and p.status_moderacao = 'aprovada'
  );
$$;

revoke all on function public.foto_aprovada(text) from public, anon;
grant execute on function public.foto_aprovada(text) to authenticated;

drop policy if exists fotos_le on storage.objects;
create policy fotos_le on storage.objects
  for select to authenticated using (
    bucket_id = 'fotos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.foto_aprovada(name)
    )
  );
