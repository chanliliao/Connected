create table if not exists couple_notes (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users(id) on delete cascade not null,
  partner_id uuid references auth.users(id),
  content text not null,
  created_at timestamptz default now()
);

alter table couple_notes enable row level security;

create policy "couple_notes_select" on couple_notes
  for select using (auth.uid() = created_by or auth.uid() = partner_id);

create policy "couple_notes_insert" on couple_notes
  for insert with check (auth.uid() = created_by);

create policy "couple_notes_delete" on couple_notes
  for delete using (auth.uid() = created_by);
