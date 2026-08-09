# LeadPilot AI — Progress Report

## Repository

`victoryude482-rgb/leadpilot-ai1`

## Current branch

`codex/lead-import-v2`

## Completed

- MVP product direction documented.
- Shared lead-scoring concept established.
- Shared agent memory and integration contract added.
- Free-first provider architecture specified.
- Lead-provider abstraction and search/deduplication pipeline added.
- Business verification and transparent lead scoring added.
- Reliability reporting and live website reachability checks added.
- Account-scoped lead/business persistence and Supabase migration schema added.
- Lead Finder API and frontend search/results flow added.
- GitHub Actions quality workflow added.

## Connected agent flow

`Lead Finder → Verification → Scoring → CRM → Outreach → Conversation/Sales Agent → CRM`

Agents share canonical account/lead/business IDs and structured memory/events rather than isolated copies of lead records.

## Current work

The lead-finder milestone is implemented on `codex/lead-import-v2`. The remaining work is validation and hardening: get the quality workflow green, then wire production provider/auth/database configuration and deployment.

## Safety/data-quality rules

- Verified facts are separate from predictions.
- AI must not invent business facts.
- Important memory changes are auditable.
- User/account authorization is required for memory access.
- Secrets must never be stored in agent memory.
- Automatic mass outreach is not enabled in the MVP.

## Next milestone

Make CI green on the current branch, then complete production configuration and deployment readiness.
