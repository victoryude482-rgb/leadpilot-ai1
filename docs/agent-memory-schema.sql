-- LeadPilot AI shared memory foundation.
-- Facts, inferences, events, and conversation summaries share canonical IDs.

create table if not exists agent_memory (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  lead_id uuid,
  business_id uuid,
  conversation_id uuid,
  scope text not null check (scope in ('account','lead','conversation','system')),
  memory_type text not null,
  content jsonb not null,
  source text,
  confidence numeric(5,4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_agent_memory_account on agent_memory(account_id);
create index if not exists idx_agent_memory_lead on agent_memory(lead_id);
create index if not exists idx_agent_memory_conversation on agent_memory(conversation_id);

create table if not exists agent_events (
  event_id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  lead_id uuid,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_agent_events_lead_created on agent_events(lead_id, created_at desc);

-- Design rule: verified facts and AI inferences are stored as separate memory_type values.
-- Secrets, passwords, access tokens, and API keys must never be written here.
