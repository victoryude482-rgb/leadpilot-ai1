# LeadPilot production readiness

## Current status

The Lead Finder pipeline and API adapters are implemented on `codex/lead-import-v2` and proposed in draft PR #2.

## Required before production

- Configure Supabase project and apply `supabase/migrations/004_full_lead_pipeline.sql`.
- Configure authentication and enforce account-level row security in Supabase.
- Configure at least one legitimate, contract-compliant lead-data provider and its server-side credentials.
- Connect `postLeadsSearch` to the app's framework HTTP route at `POST /api/leads/search`.
- Connect the dashboard search form to `searchLeadFinder` and render `LeadFinderResults`.
- Run the repository's package-manager build, typecheck, lint, and test commands in CI.
- Add rate limiting, request logging, provider failure handling, and SSRF protections around website checks.
- Configure deployment secrets; never commit provider or Supabase service credentials.
- Verify the deployed URL and smoke-test authentication, lead search, persistence, and account isolation.

## Definition of done

A user can sign in, search for a target market, receive real provider-backed prospects, see verification/reliability evidence, and have those leads saved to only their account in Supabase.
