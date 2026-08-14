export type CampaignAction = 'RESEARCH' | 'CONTACT' | 'FOLLOW_UP' | 'QUALIFY' | 'OFFER' | 'BOOKING' | 'STOP';

export interface CampaignLead {
  id: string;
  status: string;
  score: number;
  email?: string;
  phone?: string;
  consent?: boolean;
  optedOut?: boolean;
  lastContactedAt?: string;
  followUpsSent?: number;
}

export interface CampaignDecision {
  action: CampaignAction;
  reason: string;
  priority: number;
}

const DAY = 86_400_000;

export function decideNextAction(lead: CampaignLead, now = new Date()): CampaignDecision {
  if (lead.optedOut || ['CUSTOMER', 'NOT_INTERESTED', 'DO_NOT_CONTACT'].includes(lead.status)) {
    return { action: 'STOP', reason: 'Lead is closed or opted out.', priority: 0 };
  }
  if (!lead.email && !lead.phone) {
    return { action: 'RESEARCH', reason: 'No contact channel is available.', priority: 100 };
  }
  if (lead.status === 'INTERESTED') return { action: 'OFFER', reason: 'Lead has shown buying intent.', priority: 95 };
  if (lead.status === 'MEETING') return { action: 'BOOKING', reason: 'Lead is ready for scheduling.', priority: 90 };
  if (lead.status === 'REPLIED') return { action: 'QUALIFY', reason: 'Lead replied and needs qualification.', priority: 85 };
  if (!lead.lastContactedAt) return { action: 'CONTACT', reason: 'No initial outreach recorded.', priority: Math.max(60, lead.score) };

  const followUps = lead.followUpsSent ?? 0;
  const elapsed = now.getTime() - new Date(lead.lastContactedAt).getTime();
  if (followUps < 3 && elapsed >= 3 * DAY) {
    return { action: 'FOLLOW_UP', reason: 'Follow-up window is due.', priority: Math.max(50, lead.score) };
  }
  return { action: 'STOP', reason: 'No automated action is currently due.', priority: 0 };
}
