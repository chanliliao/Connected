-- Drop existing policies if any (safe to re-run)
drop policy if exists "couple_photos_select" on couple_photos;
drop policy if exists "couple_photos_insert" on couple_photos;
drop policy if exists "couple_photos_delete" on couple_photos;

-- Recreate cleanly
create policy "couple_photos_select" on couple_photos
  for select using (auth.uid() = uploaded_by or auth.uid() = partner_id);

create policy "couple_photos_insert" on couple_photos
  for insert with check (auth.uid() = uploaded_by);

create policy "couple_photos_delete" on couple_photos
  for delete using (auth.uid() = uploaded_by);
