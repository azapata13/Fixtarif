do $$ begin
  create type public.shipment_status as enum ('draft', 'validation', 'ready', 'archived');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.shipment_reason as enum ('sale', 'subcontracting', 'repair', 'treatment', 'return_rma', 'sample_test', 'loaned_material', 'tools_return', 'other');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_term as enum ('prepaid', 'collect', 'third_party');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  reference text not null,
  shipment_date date not null default current_date,
  destination_country text not null default 'CA' check (destination_country in ('CA', 'US')),
  reason public.shipment_reason not null default 'sale',
  language text not null default 'fr' check (language in ('fr', 'en')),
  status public.shipment_status not null default 'draft',
  created_by uuid not null references auth.users(id),
  destination_business_id uuid references public.businesses(id) on delete set null,
  carrier_id uuid references public.carriers(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, reference)
);

create table if not exists public.shipment_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_snapshot_json jsonb not null default '{}'::jsonb,
  name text not null check (char_length(trim(name)) > 0),
  part_number text,
  quantity numeric(12, 3) not null check (quantity > 0),
  quantity_confirmed boolean not null default false,
  weight numeric(12, 3) not null check (weight > 0),
  weight_unit text not null default 'lb' check (weight_unit in ('lb', 'kg')),
  weight_confirmed boolean not null default false,
  length numeric(12, 3) check (length is null or length >= 0),
  width numeric(12, 3) check (width is null or width >= 0),
  height numeric(12, 3) check (height is null or height >= 0),
  dimension_unit text not null default 'in' check (dimension_unit in ('in', 'cm')),
  package_type public.package_type not null default 'pallet',
  lot_number text,
  container_reference text,
  release_note_reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipment_transport (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade unique,
  carrier_id uuid references public.carriers(id) on delete set null,
  carrier_snapshot_json jsonb not null default '{}'::jsonb,
  pro_number text,
  bol_number text,
  payment_term public.payment_term not null default 'prepaid',
  needs_bol boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shipment_audit_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  action text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists shipments_workspace_id_idx on public.shipments(workspace_id);
create index if not exists shipments_workspace_status_idx on public.shipments(workspace_id, status);
create index if not exists shipment_items_workspace_id_idx on public.shipment_items(workspace_id);
create index if not exists shipment_items_shipment_id_idx on public.shipment_items(shipment_id);
create index if not exists shipment_transport_workspace_id_idx on public.shipment_transport(workspace_id);
create index if not exists shipment_audit_log_workspace_id_idx on public.shipment_audit_log(workspace_id);

drop trigger if exists shipments_touch_updated_at on public.shipments;
create trigger shipments_touch_updated_at before update on public.shipments for each row execute function public.touch_updated_at();

drop trigger if exists shipment_items_touch_updated_at on public.shipment_items;
create trigger shipment_items_touch_updated_at before update on public.shipment_items for each row execute function public.touch_updated_at();

drop trigger if exists shipment_transport_touch_updated_at on public.shipment_transport;
create trigger shipment_transport_touch_updated_at before update on public.shipment_transport for each row execute function public.touch_updated_at();

alter table public.shipments enable row level security;
alter table public.shipment_items enable row level security;
alter table public.shipment_transport enable row level security;
alter table public.shipment_audit_log enable row level security;

drop policy if exists "Members can read shipments" on public.shipments;
create policy "Members can read shipments" on public.shipments for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert shipments" on public.shipments;
create policy "Members can insert shipments" on public.shipments for insert to authenticated with check (public.is_workspace_member(workspace_id) and created_by = auth.uid());

drop policy if exists "Members can update shipments" on public.shipments;
create policy "Members can update shipments" on public.shipments for update to authenticated using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

drop policy if exists "Managers can delete shipments" on public.shipments;
create policy "Managers can delete shipments" on public.shipments for delete to authenticated using (public.can_manage_workspace(workspace_id));

drop policy if exists "Members can read shipment items" on public.shipment_items;
create policy "Members can read shipment items" on public.shipment_items for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert shipment items" on public.shipment_items;
create policy "Members can insert shipment items" on public.shipment_items for insert to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and exists (select 1 from public.shipments where shipments.id = shipment_id and shipments.workspace_id = shipment_items.workspace_id)
);

drop policy if exists "Members can update shipment items" on public.shipment_items;
create policy "Members can update shipment items" on public.shipment_items for update to authenticated
using (public.is_workspace_member(workspace_id))
with check (
  public.is_workspace_member(workspace_id)
  and exists (select 1 from public.shipments where shipments.id = shipment_id and shipments.workspace_id = shipment_items.workspace_id)
);

drop policy if exists "Managers can delete shipment items" on public.shipment_items;
create policy "Managers can delete shipment items" on public.shipment_items for delete to authenticated using (public.can_manage_workspace(workspace_id));

drop policy if exists "Members can read shipment transport" on public.shipment_transport;
create policy "Members can read shipment transport" on public.shipment_transport for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert shipment transport" on public.shipment_transport;
create policy "Members can insert shipment transport" on public.shipment_transport for insert to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and exists (select 1 from public.shipments where shipments.id = shipment_id and shipments.workspace_id = shipment_transport.workspace_id)
);

drop policy if exists "Members can update shipment transport" on public.shipment_transport;
create policy "Members can update shipment transport" on public.shipment_transport for update to authenticated
using (public.is_workspace_member(workspace_id))
with check (
  public.is_workspace_member(workspace_id)
  and exists (select 1 from public.shipments where shipments.id = shipment_id and shipments.workspace_id = shipment_transport.workspace_id)
);

drop policy if exists "Managers can delete shipment transport" on public.shipment_transport;
create policy "Managers can delete shipment transport" on public.shipment_transport for delete to authenticated using (public.can_manage_workspace(workspace_id));

drop policy if exists "Members can read shipment audit log" on public.shipment_audit_log;
create policy "Members can read shipment audit log" on public.shipment_audit_log for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert shipment audit log" on public.shipment_audit_log;
create policy "Members can insert shipment audit log" on public.shipment_audit_log for insert to authenticated with check (public.is_workspace_member(workspace_id) and actor_user_id = auth.uid());
