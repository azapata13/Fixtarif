do $$ begin
  create type public.document_type as enum ('packing_slip', 'label', 'bol', 'commercial_invoice', 'cusma_certificate', 'source_upload');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.validation_status as enum ('draft', 'needs_review', 'validated', 'rejected');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.extraction_status as enum ('pending', 'extracted', 'needs_review', 'confirmed', 'rejected');
exception
  when duplicate_object then null;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('source-documents', 'source-documents', false, 10485760, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp']),
  ('generated-documents', 'generated-documents', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.product_customs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  destination_country text not null default 'US' check (destination_country in ('CA', 'US')),
  hs_code text,
  hts_code text,
  official_description text,
  country_of_origin text,
  source_name text,
  revision text,
  effective_date date,
  validation_status public.validation_status not null default 'draft',
  validated_by uuid references auth.users(id),
  validated_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, product_id, destination_country)
);

create table if not exists public.shipment_customs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade unique,
  buyer_business_id uuid references public.businesses(id) on delete set null,
  buyer_same_as_consignee boolean not null default true,
  broker_id uuid references public.brokers(id) on delete set null,
  incoterm text,
  customs_value numeric(12, 2),
  currency text not null default 'CAD' check (currency in ('CAD', 'USD')),
  origin_country text,
  hts_validation_status public.validation_status not null default 'draft',
  cusma_validation_status public.validation_status not null default 'draft',
  commercial_invoice_required boolean not null default false,
  cusma_required boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete set null,
  storage_bucket text not null default 'source-documents',
  storage_path text not null,
  mime_type text not null,
  original_filename text not null,
  uploaded_by uuid not null references auth.users(id),
  validation_status public.validation_status not null default 'draft',
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table if not exists public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  source_document_id uuid not null references public.source_documents(id) on delete cascade,
  raw_result_json jsonb not null default '{}'::jsonb,
  normalized_result_json jsonb not null default '{}'::jsonb,
  validation_status public.extraction_status not null default 'pending',
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_document_id)
);

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  source_document_id uuid references public.source_documents(id) on delete set null,
  document_type public.document_type not null,
  template_version text not null default 'v1',
  storage_bucket text not null default 'generated-documents',
  storage_path text not null,
  generated_by uuid not null references auth.users(id),
  generated_at timestamptz not null default now(),
  validation_status public.validation_status not null default 'draft',
  metadata_json jsonb not null default '{}'::jsonb,
  unique (storage_bucket, storage_path)
);

create index if not exists product_customs_workspace_id_idx on public.product_customs(workspace_id);
create index if not exists product_customs_product_id_idx on public.product_customs(product_id);
create index if not exists shipment_customs_workspace_id_idx on public.shipment_customs(workspace_id);
create index if not exists shipment_customs_shipment_id_idx on public.shipment_customs(shipment_id);
create index if not exists source_documents_workspace_id_idx on public.source_documents(workspace_id);
create index if not exists source_documents_shipment_id_idx on public.source_documents(shipment_id);
create index if not exists document_extractions_workspace_id_idx on public.document_extractions(workspace_id);
create index if not exists generated_documents_workspace_id_idx on public.generated_documents(workspace_id);
create index if not exists generated_documents_shipment_id_idx on public.generated_documents(shipment_id);

drop trigger if exists product_customs_touch_updated_at on public.product_customs;
create trigger product_customs_touch_updated_at before update on public.product_customs for each row execute function public.touch_updated_at();

drop trigger if exists shipment_customs_touch_updated_at on public.shipment_customs;
create trigger shipment_customs_touch_updated_at before update on public.shipment_customs for each row execute function public.touch_updated_at();

drop trigger if exists document_extractions_touch_updated_at on public.document_extractions;
create trigger document_extractions_touch_updated_at before update on public.document_extractions for each row execute function public.touch_updated_at();

alter table public.product_customs enable row level security;
alter table public.shipment_customs enable row level security;
alter table public.source_documents enable row level security;
alter table public.document_extractions enable row level security;
alter table public.generated_documents enable row level security;

drop policy if exists "Members can read product customs" on public.product_customs;
create policy "Members can read product customs" on public.product_customs for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "Managers can manage product customs" on public.product_customs;
create policy "Managers can manage product customs" on public.product_customs for all to authenticated
using (public.can_manage_workspace(workspace_id))
with check (
  public.can_manage_workspace(workspace_id)
  and exists (
    select 1 from public.products
    where products.id = product_id
      and products.workspace_id = product_customs.workspace_id
  )
);

drop policy if exists "Members can read shipment customs" on public.shipment_customs;
create policy "Members can read shipment customs" on public.shipment_customs for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage shipment customs" on public.shipment_customs;
create policy "Members can manage shipment customs" on public.shipment_customs for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (
  public.is_workspace_member(workspace_id)
  and exists (
    select 1 from public.shipments
    where shipments.id = shipment_id
      and shipments.workspace_id = shipment_customs.workspace_id
  )
  and (
    buyer_business_id is null
    or exists (
      select 1 from public.businesses
      where businesses.id = buyer_business_id
        and businesses.workspace_id = shipment_customs.workspace_id
    )
  )
  and (
    broker_id is null
    or exists (
      select 1 from public.brokers
      where brokers.id = broker_id
        and brokers.workspace_id = shipment_customs.workspace_id
    )
  )
);

drop policy if exists "Members can read source documents" on public.source_documents;
create policy "Members can read source documents" on public.source_documents for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert source documents" on public.source_documents;
create policy "Members can insert source documents" on public.source_documents for insert to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and uploaded_by = auth.uid()
  and storage_bucket = 'source-documents'
  and (
    shipment_id is null
    or exists (
      select 1 from public.shipments
      where shipments.id = shipment_id
        and shipments.workspace_id = source_documents.workspace_id
    )
  )
);

drop policy if exists "Managers can delete source documents" on public.source_documents;
create policy "Managers can delete source documents" on public.source_documents for delete to authenticated using (public.can_manage_workspace(workspace_id));

drop policy if exists "Members can read document extractions" on public.document_extractions;
create policy "Members can read document extractions" on public.document_extractions for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can manage document extractions" on public.document_extractions;
create policy "Members can manage document extractions" on public.document_extractions for all to authenticated
using (public.is_workspace_member(workspace_id))
with check (
  public.is_workspace_member(workspace_id)
  and exists (
    select 1 from public.source_documents
    where source_documents.id = source_document_id
      and source_documents.workspace_id = document_extractions.workspace_id
  )
);

drop policy if exists "Members can read generated documents" on public.generated_documents;
create policy "Members can read generated documents" on public.generated_documents for select to authenticated using (public.is_workspace_member(workspace_id));

drop policy if exists "Members can insert generated documents" on public.generated_documents;
create policy "Members can insert generated documents" on public.generated_documents for insert to authenticated
with check (
  public.is_workspace_member(workspace_id)
  and generated_by = auth.uid()
  and storage_bucket = 'generated-documents'
  and exists (
    select 1 from public.shipments
    where shipments.id = shipment_id
      and shipments.workspace_id = generated_documents.workspace_id
  )
);

drop policy if exists "Managers can delete generated documents" on public.generated_documents;
create policy "Managers can delete generated documents" on public.generated_documents for delete to authenticated using (public.can_manage_workspace(workspace_id));

drop policy if exists "Members can read own workspace source objects" on storage.objects;
create policy "Members can read own workspace source objects" on storage.objects for select to authenticated
using (
  bucket_id = 'source-documents'
  and exists (
    select 1 from public.source_documents
    where source_documents.storage_bucket = storage.objects.bucket_id
      and source_documents.storage_path = storage.objects.name
      and public.is_workspace_member(source_documents.workspace_id)
  )
);

drop policy if exists "Members can upload own workspace source objects" on storage.objects;
create policy "Members can upload own workspace source objects" on storage.objects for insert to authenticated
with check (
  bucket_id = 'source-documents'
  and split_part(name, '/', 1) in (
    select workspace_id::text from public.workspace_members
    where user_id = auth.uid()
      and status = 'active'
  )
);

drop policy if exists "Members can read own workspace generated objects" on storage.objects;
create policy "Members can read own workspace generated objects" on storage.objects for select to authenticated
using (
  bucket_id = 'generated-documents'
  and exists (
    select 1 from public.generated_documents
    where generated_documents.storage_bucket = storage.objects.bucket_id
      and generated_documents.storage_path = storage.objects.name
      and public.is_workspace_member(generated_documents.workspace_id)
  )
);

drop policy if exists "Members can upload own workspace generated objects" on storage.objects;
create policy "Members can upload own workspace generated objects" on storage.objects for insert to authenticated
with check (
  bucket_id = 'generated-documents'
  and split_part(name, '/', 1) in (
    select workspace_id::text from public.workspace_members
    where user_id = auth.uid()
      and status = 'active'
  )
);
