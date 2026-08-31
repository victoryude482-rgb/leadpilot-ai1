import type { AgentRunInput } from './runtime';
import { createOutreachDraft, type OutreachDraft } from './outreach';
import { canSendOutreach } from './outreach-guard';
import { runPythonAgent } from './python-worker';

export interface NormalOutreachResult extends OutreachDraft {
  agent: 'outreach';
  eligible: boolean;
  eligibilityReason: string;
  approvalRequired: true;
  pythonReasoning: boolean;
}

/** Python drafts; TypeScript owns eligibility and approval. Nothing is sent here. */
export async function runNormalOutreach(input: AgentRunInput): Promise<{ results: NormalOutreachResult[]; warnings: string[]; strategy: string[] }> {
  const company = input.query || 'your business';
  const fallback = createOutreachDraft({
    company,
    industry: input.industry,
    location: input.city || input.location,
    website: input.website,
    email: input.email,
    painPoint: 'an opportunity identified from verified lead evidence',
    evidence: input.website ? `your public website (${input.website})` : undefined,
  }, input.industry ? `${input.industry} growth` : 'a practical business improvement');

  const python = await runPythonAgent(input, {
    context: 'Normal outreach drafting from verified lead evidence. Create a concise, specific, non-deceptive draft. Never claim facts not supplied.',
    business: { name: company, industry: input.industry, city: input.city || input.location, country: input.country, website: input.website, email: input.email },
  });
  const reasoning = python?.results?.[0] as Record<string, unknown> | undefined;
  const draft: OutreachDraft = reasoning && typeof reasoning.subject === 'string' && typeof reasoning.body === 'string'
    ? {
        subject: reasoning.subject,
        body: reasoning.body,
        followUp: typeof reasoning.followUp === 'string' ? reasoning.followUp : fallback.followUp,
        personalization: typeof reasoning.personalization === 'string' ? reasoning.personalization : fallback.personalization,
      }
    : reasoning && typeof reasoning.draft === 'string'
      ? { ...fallback, body: reasoning.draft }
      : fallback;
  const guard = canSendOutreach({ email: input.email, phone: input.phone, optedOut: false });
  return {
    results: [{ ...draft, agent: 'outreach', eligible: guard.allowed, eligibilityReason: guard.reason, approvalRequired: true, pythonReasoning: Boolean(python) }],
    warnings: python ? [] : ['Python reasoning unavailable; TypeScript deterministic draft fallback used.'],
    strategy: [
      'Python owns personalized outreach reasoning and drafting from supplied evidence.',
      'TypeScript owns contact eligibility, approval and all send-side effects.',
      'This runtime creates drafts only; it never sends automatically.',
    ],
  };
}
