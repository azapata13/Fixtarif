do $$ begin
  create type public.carrier_type as enum ('ltl', 'ftl', 'flatbed', 'parcel', 'other');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.carriers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  carrier_type public.carrier_type not null default 'ltl',
  email text,
  phone text,
  default_provides_bol boolean not null default false,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brokers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  contact_name text,
  email text,
  phone text,
  address text,
  is_default_usa boolean not null default false,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists carriers_workspace_id_idx on public.carriers(workspace_id);
create index if not exists brokers_workspace_id_idx on public.brokers(workspace_id);

drop trigger if exists carriers_touch_updated_at on public.carriers;
create trigger carriers_touch_updated_at
before update on public.carriers
for each row execute function public.touch_updated_at();

drop trigger if exists brokers_touch_updated_at on public.brokers;
create trigger brokers_touch_updated_at
before update on public.brokers
for each row execute function public.touch_updated_at();

alter table public.carriers enable row level security;
alter table public.brokers enable row level security;

drop policy if exists "Members can read carriers" on public.carriers;
create policy "Members can read carriers"
on public.carriers for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "Managers can insert carriers" on public.carriers;
create policy "Managers can insert carriers"
on public.carriers for insert
to authenticated
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "Managers can update carriers" on public.carriers;
create policy "Managers can update carriers"
on public.carriers for update
to authenticated
using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "Managers can delete carriers" on public.carriers;
create policy "Managers can delete carriers"
on public.carriers for delete
to authenticated
using (public.can_manage_workspace(workspace_id));

drop policy if exists "Members can read brokers" on public.brokers;
create policy "Members can read brokers"
on public.brokers for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "Managers can insert brokers" on public.brokers;
create policy "Managers can insert brokers"
on public.brokers for insert
to authenticated
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "Managers can update brokers" on public.brokers;
create policy "Managers can update brokers"
on public.brokers for update
to authenticated
using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "Managers can delete brokers" on public.brokers;
create policy "Managers can delete brokers"
on public.brokers for delete
to authenticated
using (public.can_manage_workspace(workspace_id));
