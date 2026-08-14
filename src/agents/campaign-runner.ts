import type { LeadRecord, BusinessRecord } from '../leads/model';

export type CampaignAction =
  | 'RESEARCH'
  | 'CONTACT'
  | 'FOLLOW_UP'
  | 'QUALIFY'
  | 'OFFER'
  | 'BOOKING'
  | 'STOP';

export interface CampaignEvent {
  leadId: string;
  action: CampaignAction;
  reason: string;
  scheduledAt: string;
}

export interface CampaignPolicy {
  maxAttempts: number;
  followUpDelayHours: number;
  minOfferScore: number;
}

const DEFAULT_POLICY: CampaignPolicy = {
  maxAttempts: 3,
  followUpDelayHours: 48,
  minOfferScore: 75,
};

export function planCampaign(
  leads: Array<{ lead: LeadRecord; business: BusinessRecord }>,
  policy: Partial<CampaignPolicy> = {},
): CampaignEvent[] {
  const p = { ...DEFAULT_POLICY, ...policy };
  const now = Date.now();

  return leads.flatMap(({ lead, business }) => {
    if (lead.status === 'NOT_INTERESTED' || lead.status === 'CUSTOMER') return [];
    const base = { leadId: lead.id, scheduledAt: new Date(now).toISOString() };

    if (lead.status === 'NEW') {
      return [{ ...base, action: 'RESEARCH' as const, reason: `Research ${business.name} before outreach.` }];
    }
    if (lead.status === 'VERIFIED') {
      return [{ ...base, action: 'CONTACT' as const, reason: `Send personalized first contact to ${business.name}.` }];
    }
    if (lead.status === 'CONTACTED') {
      return [{ ...base, action: 'FOLLOW_UP' as const, reason: `Follow up after ${p.followUpDelayHours} hours if there is no reply.` }];
    }
    if (lead.status === 'REPLIED') {
      return [{ ...base, action: 'QUALIFY' as const, reason: 'Qualify the reply and identify buying intent.' }];
    }
    if (lead.status === 'INTERESTED') {
      if (lead.score >= p.minOfferScore) {
        return [
          { ...base, action: 'OFFER' as const, reason: `Lead score ${lead.score} meets the offer threshold.` },
          { ...base, action: 'BOOKING' as const, reason: 'Offer a booking path when a sales conversation is appropriate.' },
        ];
      }
      return [{ ...base, action: 'FOLLOW_UP' as const, reason: `Nurture lead below the ${p.minOfferScore} offer threshold.` }];
    }
    if (lead.status === 'MEETING') {
      return [{ ...base, action: 'OFFER' as const, reason: 'Meeting-stage lead can receive a tailored offer.' }];
    }
    return [];
  });
}
