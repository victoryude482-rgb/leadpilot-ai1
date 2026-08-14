import { runLeadLoop } from './lead-loop';
import type { CampaignLead } from './autonomous-campaign';

export function buildAutomationSummary(leads: CampaignLead[]) {
  const decisions = runLeadLoop(leads);
  const counts: Record<string, number> = {};
  for (const item of decisions) counts[item.action] = (counts[item.action] ?? 0) + 1;
  return { totalLeads: leads.length, actions: counts, decisions };
}
