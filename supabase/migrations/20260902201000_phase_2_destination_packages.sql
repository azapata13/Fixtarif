alter table public.shipments
add column if not exists destination_site_id uuid references public.business_sites(id) on delete set null,
add column if not exists destination_contact_id uuid references public.contacts(id) on delete set null;

create table if not exists public.shipment_packages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  package_number integer not null default 1 check (package_number > 0),
  package_count integer not null default 1 check (package_count > 0),
  package_type public.package_type not null default 'pallet',
  weight numeric(12, 3) check (weight is null or weight >= 0),
  weight_unit text not null default 'lb' check (weight_unit in ('lb', 'kg')),
  length numeric(12, 3) check (length is null or length >= 0),
  width numeric(12, 3) check (width is null or width >= 0),
  height numeric(12, 3) check (height is null or height >= 0),
  dimension_unit text not null default 'in' check (dimension_unit in ('in', 'cm')),
  stackable boolean,
  destination_label text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipments_destination_site_id_idx on public.shipments(destination_site_id);
create index if not exists shipments_destination_contact_id_idx on public.shipments(destination_contact_id);
create index if not exists shipment_packages_workspace_id_idx on public.shipment_packages(workspace_id);
create index if not exists shipment_packages_shipment_id_idx on public.shipment_packages(shipment_id);

drop trigger if exists shipment_packages_touch_updated_at on public.shipment_packages;
create trigger shipment_packages_touch_updated_at
before update on public.shipment_packages
for each row execute function public.touch_updated_at();

alter table public.shipment_packages enable row level security;

drop policy if exists "Members can read shipment packages" on public.shipment_packages;
create policy "Members can read shipment packages"
on public.shipment_packages for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert shipment packages" on public.shipment_packages;
create policy "Members can insert shipment packages"
on public.shipment_packages for insert
to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and exists (
    select 1 from public.shipments
    where shipments.id = shipment_id
      and shipments.workspace_id = shipment_packages.workspace_id
  )
);

drop policy if exists "Members can update shipment packages" on public.shipment_packages;
create policy "Members can update shipment packages"
on public.shipment_packages for update
to authenticated
using (public.is_workspace_member(workspace_id))
with check (
  public.is_workspace_member(workspace_id)
  and exists (
    select 1 from public.shipments
    where shipments.id = shipment_id
      and shipments.workspace_id = shipment_packages.workspace_id
  )
);

drop policy if exists "Managers can delete shipment packages" on public.shipment_packages;
create policy "Managers can delete shipment packages"
on public.shipment_packages for delete
to authenticated
using (public.can_manage_workspace(workspace_id));
