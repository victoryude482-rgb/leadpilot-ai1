create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  phone text,
  email text,
  address text,
  city text,
  country text,
  industry text,
  source text not null,
  created_at timestamptz not null default now()
);

alter table leads add column if not exists business_id uuid references businesses(id);
create index if not exists businesses_name_idx on businesses(lower(name));
create index if not exists leads_account_created_idx on leads(account_id, created_at desc);
