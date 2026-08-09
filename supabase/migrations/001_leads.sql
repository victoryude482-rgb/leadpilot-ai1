create extension if not exists pgcrypto;

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists businesses_name_idx on businesses(lower(name));
create index if not exists businesses_location_idx on businesses(lower(city), lower(country));

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  business_id uuid not null references businesses(id) on delete cascade,
  status text not null default 'NEW',
  score integer not null default 0 check (score between 0 and 100),
  score_label text not null default 'LOW',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_account_idx on leads(account_id);
create index if not exists leads_score_idx on leads(account_id, score desc);
create index if not exists leads_status_idx on leads(account_id, status);

create table if not exists lead_imports (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  source text not null,
  imported integer not null default 0,
  valid integer not null default 0,
  duplicates integer not null default 0,
  rejected integer not null default 0,
  created_at timestamptz not null default now()
);
