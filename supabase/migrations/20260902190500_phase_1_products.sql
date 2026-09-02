do $$ begin
  create type public.package_type as enum ('pallet', 'box', 'crate', 'bundle', 'drum', 'other');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  part_number text,
  description_fr text,
  description_en text,
  weight numeric(12, 3) check (weight is null or weight >= 0),
  weight_unit text not null default 'lb' check (weight_unit in ('lb', 'kg')),
  length numeric(12, 3) check (length is null or length >= 0),
  width numeric(12, 3) check (width is null or width >= 0),
  height numeric(12, 3) check (height is null or height >= 0),
  dimension_unit text not null default 'in' check (dimension_unit in ('in', 'cm')),
  default_package_type public.package_type not null default 'pallet',
  stackable boolean,
  default_value numeric(12, 2) check (default_value is null or default_value >= 0),
  currency text not null default 'CAD' check (currency in ('CAD', 'USD')),
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_workspace_id_idx on public.products(workspace_id);
create index if not exists products_workspace_part_number_idx on public.products(workspace_id, part_number);

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

alter table public.products enable row level security;

drop policy if exists "Members can read products" on public.products;
create policy "Members can read products"
on public.products for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "Managers can insert products" on public.products;
create policy "Managers can insert products"
on public.products for insert
to authenticated
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "Managers can update products" on public.products;
create policy "Managers can update products"
on public.products for update
to authenticated
using (public.can_manage_workspace(workspace_id))
with check (public.can_manage_workspace(workspace_id));

drop policy if exists "Managers can delete products" on public.products;
create policy "Managers can delete products"
on public.products for delete
to authenticated
using (public.can_manage_workspace(workspace_id));
