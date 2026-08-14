export type OutreachLead = { name?: string; company?: string; industry?: string; location?: string; website?: string; email?: string; painPoint?: string; evidence?: string };
export type OutreachDraft = { subject: string; body: string; followUp: string; personalization: string };
/** Approval-first outreach generator. It creates drafts only; it never sends messages. */
export function createOutreachDraft(lead: OutreachLead, offer: string): OutreachDraft {
  const recipient = lead.name || 'there';
  const company = lead.company || 'your business';
  const evidence = lead.evidence ? ` I noticed ${lead.evidence}.` : '';
  const pain = lead.painPoint ? ` You may be dealing with ${lead.painPoint}.` : '';
  return {
    subject: `${company}: quick idea about ${offer}`,
    personalization: `${company}${lead.industry ? ` in ${lead.industry}` : ''}${lead.location ? ` (${lead.location})` : ''}`,
    body: `Hi ${recipient},\n\nI came across ${company}.${evidence}${pain}\n\nI help businesses with ${offer}. If this is relevant, I can send over a short idea tailored to ${company}.\n\nWould you be open to a quick look?\n\nBest,\nVictory`,
    followUp: `Hi ${recipient}, just following up on my note about ${offer} for ${company}. If it's useful, I can send a short, no-pressure outline.`,
  };
}
