create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_email_idx on public.user_profiles(lower(email));

drop trigger if exists user_profiles_touch_updated_at on public.user_profiles;
create trigger user_profiles_touch_updated_at
before update on public.user_profiles
for each row execute function public.touch_updated_at();

alter table public.user_profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.user_profiles;
create policy "Users can read their own profile"
on public.user_profiles for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Workspace members can read peer profiles" on public.user_profiles;
create policy "Workspace members can read peer profiles"
on public.user_profiles for select
to authenticated
using (
  exists (
    select 1
    from public.workspace_members self_member
    join public.workspace_members peer_member
      on peer_member.workspace_id = self_member.workspace_id
    where self_member.user_id = auth.uid()
      and self_member.status = 'active'
      and peer_member.user_id = user_profiles.user_id
      and peer_member.status = 'active'
  )
);

drop policy if exists "Users can upsert their own profile" on public.user_profiles;
create policy "Users can upsert their own profile"
on public.user_profiles for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
on public.user_profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
