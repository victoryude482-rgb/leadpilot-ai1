# LeadPilot AI — Agent Memory & Integration Contract

## Goal

All LeadPilot agents must share a controlled memory layer so that Lead Finder, Verification, Scoring, Outreach, CRM, and the future Sales Agent do not operate as disconnected systems.

## Shared memory model

Use four memory scopes:

1. **Account memory** — the customer's company settings, target industries, locations, offer, pricing, tone, and rules.
2. **Lead memory** — verified business facts, score factors, observations, outreach history, preferences, objections, and next actions for one lead.
3. **Conversation memory** — recent messages and the current conversation state. Keep this bounded and summarize older context.
4. **System memory** — provider configuration, scoring rules, prompts, feature flags, and audit metadata. Never store secrets here.

## Memory rules

- Store facts separately from AI-generated inferences.
- Every stored fact should have a source and timestamp when possible.
- Never overwrite verified facts with an AI guess.
- AI inferences must include confidence and model/source metadata.
- Keep an audit trail for important memory changes.
- Apply tenant/user authorization to every memory read and write.
- Do not store passwords, API keys, access tokens, or unnecessary sensitive personal data in memory.
- Allow users to inspect, correct, or delete lead memory.

## Shared data contract

The modules communicate through stable IDs:

`account_id` → `lead_id` → `business_id` → `conversation_id`

Activities and events reference these IDs instead of copying whole records between agents.

## Event flow

```text
Lead Finder
   ↓ lead.discovered
Verification
   ↓ lead.verified
Scoring
   ↓ lead.scored
CRM
   ↓ lead.status_changed
Outreach
   ↓ outreach.drafted / outreach.sent
Conversation Agent
   ↓ conversation.updated
Qualification
   ↓ lead.qualified
CRM
   ↓ meeting.booked / customer.won
```

Each event should be idempotent using an `event_id`.

## Agent responsibilities

### Lead Finder
Creates candidate businesses. It must not claim verification.

### Verification Agent
Checks available evidence and writes verification checks. It owns verification status, not prospect quality.

### Scoring Agent
Reads verified facts and account preferences, calculates a transparent score, and stores score factors.

### Outreach Agent
Reads lead memory and account voice settings. It generates drafts and must never invent facts.

### Conversation/Sales Agent
Reads account memory, lead memory, score, prior outreach, objections, and conversation summary. It qualifies the prospect and updates the CRM only through validated actions.

### CRM
Owns canonical lead status and activity history.

## Memory retrieval

Agents should retrieve only the minimum relevant memory for a task:

- Account preferences for every customer-facing task.
- Verified lead facts before making factual claims.
- Recent conversation plus a compact summary for conversations.
- Score factors when explaining why a lead is recommended.

## Failure behavior

If memory is unavailable, the agent must fail safely and avoid fabricating missing context. It should say that required information is unavailable and continue only with facts it has.

## Future integrations

Providers must be behind interfaces so the core system can later connect to:

- business/lead data providers
- website verification providers
- AI model providers
- email providers
- WhatsApp providers
- calendar providers
- CRM integrations

No provider-specific API calls should be scattered throughout the application.
