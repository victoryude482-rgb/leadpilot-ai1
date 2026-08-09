# LeadPilot AI — Connected Build Plan

## Current milestone

Build the shared foundation first, then connect the agents through common data and events.

## Milestones

1. Lead import + canonical lead/business records
2. Verification checks + evidence
3. Transparent scoring + score factors
4. Shared memory repository + audit trail
5. CRM pipeline + activities
6. Outreach generation
7. Conversation/sales agent using shared memory
8. Lead discovery providers
9. Calendar/messaging provider adapters
10. Dashboard, analytics, deployment, and hardening

## Definition of done for agent connectivity

An agent is not considered connected merely because it can call another function. It must:

- read canonical records by ID;
- write structured outputs to the shared store;
- emit an auditable event;
- avoid duplicating conflicting data;
- respect account/user permissions;
- handle missing context safely.

## Free-first rule

The first end-to-end demo must work with local/fixture data and CSV import. External paid providers are optional adapters, not requirements for core functionality.

## Testing strategy

Use deterministic fixtures for each agent and test the full chain:

`import → verify → score → remember → outreach → CRM`

Then add conversation tests:

`outreach → conversation → qualification → CRM update`
