do $$ begin
  create type public.business_role as enum ('client', 'supplier', 'subcontractor', 'consignee', 'buyer', 'other');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.contact_type as enum ('commercial', 'receiving', 'shipping', 'project', 'accounting', 'other');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  tax_number text,
  email text,
  phone text,
  roles public.business_role[] not null default array['client']::public.business_role[],
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.business_sites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null default 'Principal',
  address text,
  city text,
  region text,
  postal_code text,
  country text not null default 'CA',
  opening_time time,
  closing_time time,
  dock_info text,
  flatbed_required boolean not null default false,
  appointment_required boolean not null default false,
  call_before_minutes integer check (call_before_minutes is null or call_before_minutes >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  site_id uuid references public.business_sites(id) on delete set null,
  name text not null check (char_length(trim(name)) > 0),
  role text,
  email text,
  phone text,
  extension text,
  contact_type public.contact_type not null default 'receiving',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_workspace_id_idx on public.businesses(workspace_id);
create index if not exists business_sites_workspace_id_idx on public.business_sites(workspace_id);
create index if not exists business_sites_business_id_idx on public.business_sites(business_id);
create index if not exists contacts_workspace_id_idx on public.contacts(workspace_id);
create index if not exists contacts_business_id_idx on public.contacts(business_id);
create index if not exists contacts_site_id_idx on public.contacts(site_id);

drop trigger if exists businesses_touch_updated_at on public.businesses;
create trigger businesses_touch_updated_at
before update on public.businesses
for each row execute function public.touch_updated_at();

drop trigger if exists business_sites_touch_updated_at on public.business_sites;
create trigger business_sites_touch_updated_at
before update on public.business_sites
for each row execute function public.touch_updated_at();

drop trigger if exists contacts_touch_updated_at on public.contacts;
create trigger contacts_touch_updated_at
before update on public.contacts
for each row execute function public.touch_updated_at();

alter table public.businesses enable row level security;
alter table public.business_sites enable row level security;
alter table public.contacts enable row level security;

drop policy if exists "Members can read businesses" on public.businesses;
create policy "Members can read businesses"
on public.businesses for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "Managers can insert businesses" on public.businesses;
create policy "Managers can insert businesses"
on public.businesses for insert
to authenticated
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "Managers can update businesses" on public.businesses;
create policy "Managers can update businesses"
on public.businesses for update
to authenticated
using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "Managers can delete businesses" on public.businesses;
create policy "Managers can delete businesses"
on public.businesses for delete
to authenticated
using (public.can_manage_workspace(workspace_id));

drop policy if exists "Members can read business sites" on public.business_sites;
create policy "Members can read business sites"
on public.business_sites for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "Managers can insert business sites" on public.business_sites;
create policy "Managers can insert business sites"
on public.business_sites for insert
to authenticated
with check (
  public.can_manage_workspace(workspace_id)
  and exists (
    select 1 from public.businesses
    where businesses.id = business_id
      and businesses.workspace_id = business_sites.workspace_id
  )
);

drop policy if exists "Managers can update business sites" on public.business_sites;
create policy "Managers can update business sites"
on public.business_sites for update
to authenticated
using (public.can_manage_workspace(workspace_id))
with check (
  public.can_manage_workspace(workspace_id)
  and exists (
    select 1 from public.businesses
    where businesses.id = business_id
      and businesses.workspace_id = business_sites.workspace_id
  )
);

drop policy if exists "Managers can delete business sites" on public.business_sites;
create policy "Managers can delete business sites"
on public.business_sites for delete
to authenticated
using (public.can_manage_workspace(workspace_id));

drop policy if exists "Members can read contacts" on public.contacts;
create policy "Members can read contacts"
on public.contacts for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "Managers can insert contacts" on public.contacts;
create policy "Managers can insert contacts"
on public.contacts for insert
to authenticated
with check (
  public.can_manage_workspace(workspace_id)
  and exists (
    select 1 from public.businesses
    where businesses.id = business_id
      and businesses.workspace_id = contacts.workspace_id
  )
  and (
    site_id is null
    or exists (
      select 1 from public.business_sites
      where business_sites.id = site_id
        and business_sites.business_id = contacts.business_id
        and business_sites.workspace_id = contacts.workspace_id
    )
  )
);

drop policy if exists "Managers can update contacts" on public.contacts;
create policy "Managers can update contacts"
on public.contacts for update
to authenticated
using (public.can_manage_workspace(workspace_id))
with check (
  public.can_manage_workspace(workspace_id)
  and exists (
    select 1 from public.businesses
    where businesses.id = business_id
      and businesses.workspace_id = contacts.workspace_id
  )
  and (
    site_id is null
    or exists (
      select 1 from public.business_sites
      where business_sites.id = site_id
        and business_sites.business_id = contacts.business_id
        and business_sites.workspace_id = contacts.workspace_id
    )
  )
);

drop policy if exists "Managers can delete contacts" on public.contacts;
create policy "Managers can delete contacts"
on public.contacts for delete
to authenticated
using (public.can_manage_workspace(workspace_id));
