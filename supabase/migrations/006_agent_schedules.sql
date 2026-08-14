create table if not exists public.agent_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null,
  query text not null,
  location text,
  industry text,
  limit_count integer not null default 10 check (limit_count between 1 and 100),
  frequency text not null check (frequency in ('hourly','daily','weekly')),
  active boolean not null default true,
  next_run_at timestamptz not null default now(),
  last_run_at timestamptz,
  last_status text,
  last_result_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists agent_schedules_due_idx on public.agent_schedules(active, next_run_at);
create index if not exists agent_schedules_user_idx on public.agent_schedules(user_id);

alter table public.agent_schedules enable row level security;

drop policy if exists "users manage own agent schedules" on public.agent_schedules;
create policy "users manage own agent schedules"
  on public.agent_schedules for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.bump_agent_schedule_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists agent_schedules_updated_at on public.agent_schedules;
create trigger agent_schedules_updated_at
before update on public.agent_schedules
for each row execute function public.bump_agent_schedule_updated_at();
