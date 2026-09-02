create extension if not exists "pgcrypto";

do $$ begin
  create type public.workspace_role as enum ('owner', 'admin', 'member');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.member_status as enum ('active', 'invited', 'disabled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'member',
  status public.member_status not null default 'active',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.company_profiles (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade unique,
  legal_name text not null check (char_length(trim(legal_name)) > 0),
  trade_name text,
  address text,
  city text,
  region text,
  postal_code text,
  country text not null default 'CA',
  phone text,
  email text,
  tax_number text,
  language text not null default 'fr' check (language in ('fr', 'en')),
  weight_unit text not null default 'lb' check (weight_unit in ('lb', 'kg')),
  dimension_unit text not null default 'in' check (dimension_unit in ('in', 'cm')),
  currency text not null default 'CAD' check (currency in ('CAD', 'USD')),
  reference_format text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
create index if not exists company_profiles_workspace_id_idx on public.company_profiles(workspace_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists company_profiles_touch_updated_at on public.company_profiles;
create trigger company_profiles_touch_updated_at
before update on public.company_profiles
for each row execute function public.touch_updated_at();

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members
    where workspace_id = target_workspace_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
      and status = 'active'
  );
$$;

create or replace function public.create_workspace_with_owner(workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if workspace_name is null or char_length(trim(workspace_name)) = 0 then
    raise exception 'Workspace name is required';
  end if;

  insert into public.workspaces (name)
  values (trim(workspace_name))
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, status)
  values (new_workspace_id, auth.uid(), 'owner', 'active');

  return new_workspace_id;
end;
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.company_profiles enable row level security;

drop policy if exists "Members can read their workspaces" on public.workspaces;
create policy "Members can read their workspaces"
on public.workspaces for select
to authenticated
using (public.is_workspace_member(id));

drop policy if exists "Managers can update workspaces" on public.workspaces;
create policy "Managers can update workspaces"
on public.workspaces for update
to authenticated
using (public.can_manage_workspace(id))
with check (public.can_manage_workspace(id));

drop policy if exists "Members can read memberships in their workspaces" on public.workspace_members;
create policy "Members can read memberships in their workspaces"
on public.workspace_members for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "Owners and admins can manage memberships" on public.workspace_members;
create policy "Owners and admins can manage memberships"
on public.workspace_members for all
to authenticated
using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "Members can read company profile" on public.company_profiles;
create policy "Members can read company profile"
on public.company_profiles for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "Managers can insert company profile" on public.company_profiles;
create policy "Managers can insert company profile"
on public.company_profiles for insert
to authenticated
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "Managers can update company profile" on public.company_profiles;
create policy "Managers can update company profile"
on public.company_profiles for update
to authenticated
using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));

revoke all on function public.create_workspace_with_owner(text) from public;
grant execute on function public.create_workspace_with_owner(text) to authenticated;
