-- Allow authenticated users to upload to the couple-photos bucket
create policy "couple_photos_storage_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'couple-photos');

-- Allow authenticated users to read from the couple-photos bucket
create policy "couple_photos_storage_select"
on storage.objects for select
to authenticated
using (bucket_id = 'couple-photos');

-- Allow authenticated users to delete their own uploads
create policy "couple_photos_storage_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'couple-photos');
