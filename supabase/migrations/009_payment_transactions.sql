create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null unique,
  provider text not null default 'paystack',
  status text not null default 'initialized' check (status in ('initialized','success','failed','reversed')),
  amount bigint not null default 0,
  currency text not null default 'NGN',
  lead_id text,
  agent_id text,
  offer_name text,
  provider_transaction_id text,
  paid_at timestamptz,
  raw_event jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payment_transactions_user_idx on public.payment_transactions(user_id);
create index if not exists payment_transactions_provider_id_idx on public.payment_transactions(provider_transaction_id);
alter table public.payment_transactions enable row level security;
drop policy if exists "users manage own payment transactions" on public.payment_transactions;
create policy "users manage own payment transactions" on public.payment_transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.processed_payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paystack',
  event_id text not null unique,
  reference text,
  received_at timestamptz not null default now()
);
create index if not exists processed_payment_events_reference_idx on public.processed_payment_events(reference);
alter table public.processed_payment_events enable row level security;

create or replace function public.bump_payment_transaction_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists payment_transactions_updated_at on public.payment_transactions;
create trigger payment_transactions_updated_at before update on public.payment_transactions for each row execute function public.bump_payment_transaction_updated_at();
