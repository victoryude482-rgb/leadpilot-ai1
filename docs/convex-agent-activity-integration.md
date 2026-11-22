# Convex Integration Plan — LeadPilot AI

## Status
Architecture planning only. No Convex dependency or runtime code has been added yet.

## Existing architecture
- Next.js 14 App Router, React 18, TypeScript
- Supabase Auth and SSR cookie sessions
- Supabase/Postgres as persistent business data store
- Company membership, roles, and RLS security boundaries
- Lead discovery, evidence, scoring, research agents, approval-first outreach
- Optional Python reasoning worker with TypeScript fallback

## Decision
Keep Supabase as the system of record for users, companies, membership, leads, evidence, reports, approvals, finance, and CRM. Do not migrate or duplicate these records into Convex.

Use Convex as an optional real-time agent activity layer, initially limited to transient execution status and progress events. Convex must not become an authorization source or bypass Supabase company membership checks.

## Proposed first capability
Agent activity feed:
- runId, companyId, agentType, displayName
- status: queued | running | completed | failed | cancelled
- progress count/step, safe status message
- startedAt, updatedAt, finishedAt
- optional error code (never secrets or raw sensitive provider responses)

The Next.js server creates/authorizes a run using Supabase. Only trusted server-side code writes activity records. The browser subscribes to activity for runs it is authorized to view. Company-scoped authorization must be validated on the server before returning/subscribing to data; client-supplied companyId is not trusted.

## Integration phases
1. Review the existing Supabase agent/job lifecycle and API boundaries.
2. Define an adapter interface so Convex is optional and the existing implementation remains functional.
3. Configure Convex cloud deployment and server credentials outside source control.
4. Add a minimal Convex schema/functions for agent activity only.
5. Wire one agent end-to-end (start, progress, completion/failure) and a dashboard activity UI.
6. Add tests for authorization, status transitions, failure fallback, and duplicate events.
7. Verify typecheck, tests, lint, and build before proposing merge.

## Safety and operational rules
- Never expose Convex admin/deployment credentials in NEXT_PUBLIC variables or committed files.
- Do not store lead/contact data, secrets, email contents, or provider payloads in the initial activity layer.
- Supabase remains authoritative for authentication, tenant membership, approvals, and business records.
- If Convex is unavailable, agent execution and the existing UI must continue using the current system; activity realtime may degrade gracefully.
- Keep the integration behind a feature flag until verified.

## Acceptance criteria for the first implementation
- Existing app functionality is unchanged when Convex is disabled.
- An authorized workspace user can see live activity for a run in their company.
- Users cannot read or write another company's activity.
- Agent status transitions are validated and idempotent.
- No secrets or sensitive provider responses are stored in activity records.
- Existing tests pass, with new integration tests covering the adapter and authorization.
