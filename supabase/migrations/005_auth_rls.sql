-- LeadPilot account isolation for Supabase/Postgres.
-- Apply after the existing lead tables migration.

create schema if not exists app;

create or replace function app.current_account_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

-- Example policy pattern for account-owned lead records.
-- Keep service-role/server-side ingestion separate from user-facing reads.
do $$
begin
  if to_regclass('public.leads') is not null then
    alter table public.leads enable row level security;
    drop policy if exists "account can read own leads" on public.leads;
    create policy "account can read own leads"
      on public.leads for select
      using (account_id = app.current_account_id());

    drop policy if exists "account can delete own leads" on public.leads;
    create policy "account can delete own leads"
      on public.leads for delete
      using (account_id = app.current_account_id());
  end if;
end $$;

-- Never expose provider credentials to clients. Server-side ingestion should use
-- the Supabase service role only in trusted server environments.
