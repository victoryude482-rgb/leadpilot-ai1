create table if not exists public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id text,
  agent_id text,
  event text not null check (event in ('qualified','draft_created','contacted','replied','meeting_booked','won','lost')),
  value numeric not null default 0,
  currency text not null default 'USD',
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists revenue_events_user_agent_idx on public.revenue_events(user_id, agent_id, occurred_at desc);
alter table public.revenue_events enable row level security;
drop policy if exists revenue_events_owner on public.revenue_events;
create policy revenue_events_owner on public.revenue_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
