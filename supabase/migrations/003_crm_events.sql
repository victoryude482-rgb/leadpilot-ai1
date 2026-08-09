create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  lead_id uuid not null references leads(id) on delete cascade,
  type text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists activities_lead_idx on activities(lead_id, created_at desc);

create table if not exists status_history (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  lead_id uuid not null references leads(id) on delete cascade,
  old_status text,
  new_status text not null,
  created_at timestamptz not null default now()
);

create index if not exists status_history_lead_idx on status_history(lead_id, created_at desc);
