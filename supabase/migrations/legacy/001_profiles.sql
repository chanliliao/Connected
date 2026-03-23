-- Public profiles table (extends auth.users)
create table public.profiles (
  id         uuid references auth.users(id) on delete cascade primary key,
  username   text unique,
  first_name text,
  last_name  text,
  birthday   date,
  role       text not null default 'user',
  created_at timestamptz not null default now()
);

-- Row Level Security: users can only see/edit their own profile
alter table public.profiles enable row level security;

create policy "select own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, first_name, last_name, birthday, role)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    (new.raw_user_meta_data->>'birthday')::date,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$;

-- Note: no insert policy is defined; all inserts go through the trigger above.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
