import { decideNextAction, type CampaignLead, type CampaignDecision } from './autonomous-campaign';
import { canSendOutreach } from './outreach-guard';

export interface ExecutionResult extends CampaignDecision {
  executed: boolean;
}

export function planCampaignExecution(lead: CampaignLead, sentToday = 0): ExecutionResult {
  const decision = decideNextAction(lead);
  if (['CONTACT', 'FOLLOW_UP'].includes(decision.action)) {
    const guard = canSendOutreach({
      optedOut: lead.optedOut,
      email: lead.email,
      phone: lead.phone,
      consent: lead.consent,
      sentToday,
    });
    if (!guard.allowed) return { ...decision, action: 'STOP', reason: guard.reason, executed: false };
  }
  return { ...decision, executed: decision.action !== 'STOP' };
}
