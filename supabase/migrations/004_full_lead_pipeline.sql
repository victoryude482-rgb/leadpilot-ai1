create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  name text not null,
  website text,
  phone text,
  email text,
  address text,
  city text,
  country text,
  industry text,
  source text not null,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists businesses_account_identity_idx
  on businesses(account_id, lower(name), lower(coalesce(city, '')), lower(coalesce(country, '')));

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  business_id uuid not null references businesses(id) on delete cascade,
  status text not null default 'NEW',
  score integer not null default 0 check (score between 0 and 100),
  score_label text not null default 'LOW',
  reliability_confidence integer check (reliability_confidence between 0 and 100),
  reliability_level text,
  website_status text,
  recommendation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_account_score_idx on leads(account_id, score desc);
create index if not exists leads_account_status_idx on leads(account_id, status);
