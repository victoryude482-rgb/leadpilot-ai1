# LeadPilot AI — Progress Report

## Repository

`victoryude482-rgb/leadpilot-ai1`

## Current branch

`codex/lead-import-v2`

## Completed

- MVP product direction documented.
- Shared lead-scoring concept established.
- Development branch created for lead-import work.
- Agent memory and integration contract added.
- Connected build plan added.
- Free-first provider architecture specified.

## Memory architecture

The planned shared memory is split into account memory, lead memory, conversation memory, and system memory. Agents use canonical IDs and structured events so information is shared rather than copied between agents.

## Agent connection flow

`Lead Finder → Verification → Scoring → CRM → Outreach → Conversation/Sales Agent → CRM`

## Current work

Lead import and canonical business/lead storage are next. Verification, scoring, shared memory persistence, and CRM will then be wired into the same data model.

## Safety/data-quality rules

- Verified facts are separate from predictions.
- AI must not invent business facts.
- Important memory changes are auditable.
- User/account authorization is required for memory access.
- Secrets must never be stored in agent memory.
- Automatic mass outreach is not enabled in the MVP.

## Next milestone

Implement the actual lead import/database layer and connect it to the shared memory contract.
