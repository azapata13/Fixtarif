alter table public.product_customs
  add column if not exists general_rate text,
  add column if not exists special_rate text,
  add column if not exists other_rate text,
  add column if not exists units text[],
  add column if not exists last_checked_at timestamptz,
  add column if not exists hts_result_json jsonb not null default '{}'::jsonb;

create index if not exists product_customs_hts_code_idx on public.product_customs(hts_code);
create index if not exists product_customs_last_checked_at_idx on public.product_customs(last_checked_at);
