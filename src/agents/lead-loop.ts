import { decideNextAction, type CampaignLead } from './autonomous-campaign';

export interface LeadLoopResult {
  leadId: string;
  action: ReturnType<typeof decideNextAction>['action'];
  reason: string;
}

export function runLeadLoop(leads: CampaignLead[], now = new Date()): LeadLoopResult[] {
  return leads.map(lead => {
    const decision = decideNextAction(lead, now);
    return { leadId: lead.id, action: decision.action, reason: decision.reason };
  });
}
