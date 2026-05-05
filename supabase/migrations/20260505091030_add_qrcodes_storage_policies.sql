-- 1) Upload (INSERT)
create policy "qrcodes_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'qrcodes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 2) Read (SELECT)
create policy "qrcodes_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'qrcodes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3) Update (optional)
create policy "qrcodes_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'qrcodes'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'qrcodes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4) Delete (optional)
create policy "qrcodes_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'qrcodes'
  AND (storage.foldername(name))[1] = auth.uid()::text
);