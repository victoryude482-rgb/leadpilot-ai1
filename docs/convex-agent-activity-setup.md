# Convex agent activity integration

## Architecture boundary

Supabase remains LeadPilot's system of record for authentication, company membership, roles, RLS, tasks, leads, research reports, approvals, and CRM data.

Convex is introduced only as a real-time projection of agent task activity. The first version stores task metadata (company/user/task identifiers, title, agent key, status, timestamps, and a safe status message). It does not store lead records, contact details, research payloads, email content, credentials, or provider responses.

If Convex is not configured, the existing Supabase task route continues to work. Activity publication is best-effort and must never fail the underlying research task.

## Files added

- `convex/schema.ts`: activity table and indexes.
- `convex/auth.config.ts`: Supabase JWT authentication provider.
- `convex/agentActivity.ts`: authenticated user query and server-ingestion mutation.
- `src/convex/activity.ts`: server-only Convex publisher.
- `app/ConvexClientProvider.tsx`: Convex React provider using the existing Supabase session.
- `components/agent-activity-feed.tsx`: real-time activity feed on the AI employees page.

## Required configuration

### 1. Convex deployment

Use the existing Convex account to create or select a development deployment for LeadPilot AI. Do not create an anonymous deployment.

Set these environment variables in the Convex deployment:

- `SUPABASE_JWT_ISSUER`: the exact `iss` value in a Supabase user access token. It is normally `https://<project-ref>.supabase.co/auth/v1`.
- `LEADPILOT_ACTIVITY_INGEST_KEY`: a long, randomly generated secret used only by the Next.js server to publish activity.

The deployment must have the Supabase authentication provider configured. This project config expects the JWT audience to be `authenticated`.

**JWT signing compatibility check:** Convex's built-in JWT verification supports asymmetric signing algorithms (RS256/ES256). Supabase's JWKS endpoint only publishes keys when the project uses asymmetric JWT signing keys. Confirm the Supabase access token's `alg` header and that `<SUPABASE_JWT_ISSUER>/.well-known/jwks.json` returns the matching public key. If the project still uses legacy HS256 signing, do not weaken verification or expose the signing secret; we must switch to a server-minted short-lived JWT bridge before enabling the feed.

### 2. Next.js deployment environment

Set these variables in the Next.js hosting environment (Cloudflare or whichever host currently runs the app):

- `NEXT_PUBLIC_CONVEX_URL`: the Convex deployment URL ending in `.convex.cloud`. This is public and used by the browser client.
- `CONVEX_URL`: the same deployment URL, used by the server-side HTTP client.
- `LEADPILOT_ACTIVITY_INGEST_KEY`: the exact same secret set in the Convex deployment. This variable must remain server-only and must not use the `NEXT_PUBLIC_` prefix.

Never commit real secrets to GitHub or paste them into chat.

### 3. Deploy through GitHub Actions (no Termux required)

This branch includes `.github/workflows/convex-dev.yml`. It deploys the Convex backend from GitHub Actions after the required secrets are added.

In GitHub, open the repository:

**Settings → Secrets and variables → Actions → New repository secret**

Add these three secrets:

- `CONVEX_DEPLOY_KEY`: create a **development deploy key** for the LeadPilot development deployment in the Convex dashboard. Do not use a production deploy key for this workflow.
- `SUPABASE_JWT_ISSUER`: `https://nktsdsdmdnhintykjiiu.supabase.co/auth/v1` (this matches the Supabase project URL already configured in `.env.example`; confirm it matches the `iss` claim of a real access token).
- `LEADPILOT_ACTIVITY_INGEST_KEY`: generate a long random secret. Use the same value in the Next.js hosting environment and the Convex deployment.

After adding the secrets, push a new commit to `feat/convex-agent-activity` (or ask for a small trigger commit). The workflow will install dependencies, set the two Convex environment variables, run `npx convex dev --once`, and print the resulting Convex URL in the Actions run summary.

Then set that URL as both `CONVEX_URL` and `NEXT_PUBLIC_CONVEX_URL` in the Next.js hosting environment. Keep `LEADPILOT_ACTIVITY_INGEST_KEY` server-only; never add a `NEXT_PUBLIC_` prefix.

The deployment step generates Convex code and pushes the schema/functions. Once the deployment is available, run the existing repository checks (typecheck, tests, build) through CI before enabling the feed on the production app.

Do not enable the activity feed in production until the JWT issuer/audience and live subscription are verified.

## Security model

- The browser can call `listMine`, which requires a verified Convex identity and filters by JWT `sub` (the Supabase user ID).
- The ingestion mutation requires the server-only shared secret.
- The Next.js route obtains the user and company from Supabase; it never trusts client-supplied company or user identifiers.
- Task ownership is checked on upsert so an existing task activity row cannot be reassigned to a different user or company.
- Ingestion errors are swallowed by the optional publisher so Supabase task execution remains authoritative.

## First-version limitations

- The current task execution route is synchronous, so this feed publishes start, completion, and failure transitions. It does not yet stream intermediate provider-level progress.
- The initial feed is per-user, not a shared company-wide feed. Company-wide visibility requires a verified membership claim or a server-authorized subscription design; do not simply accept a client-supplied company ID.
- Existing queued tasks created from the AI employees form are not yet executed by this route and therefore do not emit Convex activity until they enter the run endpoint.
