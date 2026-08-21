# LeadPilot AI

Free-first B2B lead intelligence, work discovery and AI business-building workspace.

## Current capabilities

- Lead discovery, verification and transparent 0–100 scoring
- Trend and opportunity research agents
- Scheduled agent runs
- **WorkPilot AI**: discovers public/indexed opportunities across Indeed, Upwork, Freelancer and Fiverr, deduplicates and ranks them, explains the client problem, proposes a solution, creates an implementation plan and drafts an approval-ready proposal
- **AI Website & Brand Agent**: creates a JSON-first website structure and logo asset; with `TOGETHER_API_KEY` it can use Together AI image generation, otherwise it produces a deterministic SVG fallback
- Personalized outreach drafts
- CRM workflow and revenue attribution

## GBP agents

- **GBP Audit** checks public directory evidence for missing websites, unreachable websites, missing phone/address/category and scores listing health. By default this is an inference from public directory data, not a direct read of a Google Business Profile. Setting `GOOGLE_PLACES_API_KEY` enables the optional Google Places Text Search check.
- **GBP Outreach** creates personalized, approval-first drafts that mention only the specific issues found by the audit. It uses the existing outreach eligibility guard and never sends by itself.
- **GBP Fix** creates a concrete fix plan only after a lead reaches `CUSTOMER`. Before that status it returns `withheld, deal not closed`. When delivered for a closed deal, the handoff can attribute the won event to `gbp-fix`.

## Agent safety and evidence

LeadPilot distinguishes between **verified facts**, **publicly indexed evidence**, and **AI inferences**. Agents must not fabricate leads, contacts, prices, completed actions or Google Business Profile facts. External actions are approval-first. Outreach sending requires a signed-in user and explicit human approval.

## Environment

- `TOGETHER_API_KEY` is optional. Without it, logo generation falls back to a locally generated SVG.
- `GOOGLE_PLACES_API_KEY` is optional. Without it, GBP Audit uses the free public-directory path.
- `SUPABASE_SERVICE_ROLE_KEY` enables server-side lead persistence and the Supabase agent memory bus. Without it, the app falls back to in-memory adapters.
- `RESEND_API_KEY` and `OUTREACH_FROM_EMAIL` are optional. Without them, approval-first email sending returns a clear configuration error and does not send anything.

## Deployment

The existing Next.js application remains the main deployment. These agents are integrated into the same runtime rather than adding separate applications, so the GitHub/Render workflow stays simple.
