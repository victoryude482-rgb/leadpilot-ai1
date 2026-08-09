create table if not exists verification_checks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  check_type text not null,
  status text not null,
  evidence text not null,
  checked_at timestamptz not null default now()
);

create index if not exists verification_checks_lead_idx on verification_checks(lead_id, checked_at desc);

create table if not exists score_factors (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  factor text not null,
  points integer not null,
  explanation text not null,
  created_at timestamptz not null default now()
);

create index if not exists score_factors_lead_idx on score_factors(lead_id);
