-- Lovi — Fase 1: buckets de arquivos e realtime

-- Dois buckets, ambos privados. As fotos de perfil são lidas por terceiros
-- apenas por URL assinada, e apenas quando aprovadas (política abaixo).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('verificacoes', 'verificacoes', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- fotos: cada pessoa escreve só na própria pasta (<uid>/arquivo.jpg)
drop policy if exists fotos_envia on storage.objects;
create policy fotos_envia on storage.objects
  for insert to authenticated with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists fotos_atualiza on storage.objects;
create policy fotos_atualiza on storage.objects
  for update to authenticated using (
    bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists fotos_apaga on storage.objects;
create policy fotos_apaga on storage.objects
  for delete to authenticated using (
    bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- leitura: a própria pessoa vê tudo que é dela; terceiros só fotos aprovadas
drop policy if exists fotos_le on storage.objects;
create policy fotos_le on storage.objects
  for select to authenticated using (
    bucket_id = 'fotos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.photos p
         where p.storage_path = storage.objects.name
           and p.status_moderacao = 'aprovada'
      )
    )
  );

-- verificação: a selfie é privada, ninguém além do dono acessa
drop policy if exists verificacoes_envia on storage.objects;
create policy verificacoes_envia on storage.objects
  for insert to authenticated with check (
    bucket_id = 'verificacoes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists verificacoes_le on storage.objects;
create policy verificacoes_le on storage.objects
  for select to authenticated using (
    bucket_id = 'verificacoes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists verificacoes_apaga on storage.objects;
create policy verificacoes_apaga on storage.objects
  for delete to authenticated using (
    bucket_id = 'verificacoes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Realtime das mensagens (a conversa atualiza sozinha).
-- A publicação respeita o RLS: cada pessoa só recebe o que já poderia ler.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'matches'
  ) then
    alter publication supabase_realtime add table public.matches;
  end if;
end;
$$;
