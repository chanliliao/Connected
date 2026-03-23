-- Couple photos: shared photo album for paired users
create table if not exists couple_photos (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid references auth.users(id) on delete cascade not null,
  partner_id uuid references auth.users(id),
  image_url text not null,
  caption text default '',
  created_at timestamptz default now()
);

alter table couple_photos enable row level security;

create policy "couple_photos_select" on couple_photos
  for select using (auth.uid() = uploaded_by or auth.uid() = partner_id);

create policy "couple_photos_insert" on couple_photos
  for insert with check (auth.uid() = uploaded_by);

create policy "couple_photos_delete" on couple_photos
  for delete using (auth.uid() = uploaded_by);
