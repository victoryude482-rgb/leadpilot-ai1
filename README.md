# LeadPilot AI

Free-first B2B lead intelligence, work discovery and AI business-building workspace.

## Current capabilities

- Lead discovery, verification and transparent 0–100 scoring
- Trend and opportunity research agents
- Scheduled agent runs
- **WorkPilot AI**: discovers public/indexed opportunities across Indeed, Upwork, Freelancer and Fiverr, deduplicates and ranks them, explains the client problem, proposes a solution, creates an implementation plan and drafts an approval-ready proposal
- **AI Website & Brand Agent**: creates a JSON-first website structure and logo asset; with `TOGETHER_API_KEY` it can use Together AI image generation, otherwise it produces a deterministic SVG fallback
- Personalized outreach drafts
- Dashboard metrics and CRM workflow

## Source and safety principle

LeadPilot distinguishes between **verified facts**, **publicly indexed evidence**, and **AI inferences**. WorkPilot does not invent a job listing when a marketplace cannot be accessed. It returns an official search entry point instead. Marketplace integrations should use official APIs/plugins or permitted public sources rather than private endpoints or bypassing access controls.

## Website builder architecture

The Website & Brand Agent uses a structured JSON site representation inspired by open-source JSON-first website-builder patterns. This keeps generated pages predictable and editable before export instead of asking an LLM to write an entire fragile application from scratch.

## Environment

- `TOGETHER_API_KEY` is optional. Without it, logo generation falls back to a locally generated SVG.
- Lead provider credentials remain server-side only.

## Deployment

The existing Next.js application remains the main deployment. These agents are integrated into the same runtime rather than adding separate applications, so the GitHub/Render workflow stays simple.
