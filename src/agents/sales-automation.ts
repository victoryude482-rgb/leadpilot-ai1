import type { BusinessRecord, LeadRecord } from '../leads/model';

export interface OutreachDraft {
  subject: string;
  body: string;
  channel: 'EMAIL' | 'MANUAL_REVIEW';
}

export interface QualificationResult {
  intent: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  nextStatus: LeadRecord['status'];
  reason: string;
}

export function createOutreachDraft(business: BusinessRecord, offer = 'AI sales automation'): OutreachDraft {
  const name = business.name || 'your business';
  const websiteLine = business.website ? `I took a quick look at ${business.website}.` : 'I came across your business while researching companies in your market.';
  return {
    subject: `A simple way ${name} could capture more leads`,
    body: `Hi ${name} team,\n\n${websiteLine} I noticed an opportunity to reduce missed enquiries and automate follow-up with ${offer}.\n\nWould you be open to a quick look at how it could work for your business?\n\nBest,\nVictory AI`,
    channel: business.email ? 'EMAIL' : 'MANUAL_REVIEW',
  };
}

export function qualifyReply(text: string, current: LeadRecord): QualificationResult {
  const normalized = text.toLowerCase();
  const positive = /(interested|yes|sure|send|tell me|how much|price|pricing|demo|book|meeting|call)/i.test(normalized);
  const negative = /(no thanks|not interested|remove me|unsubscribe|stop contacting)/i.test(normalized);
  const buying = /(price|pricing|how much|book|demo|call|meeting|start|buy|purchase)/i.test(normalized);

  if (negative) return { intent: 'LOW', nextStatus: 'NOT_INTERESTED', reason: 'Reply contains a clear opt-out or rejection.' };
  if (buying) return { intent: 'HIGH', nextStatus: 'INTERESTED', reason: 'Reply contains a concrete buying or booking signal.' };
  if (positive) return { intent: 'MEDIUM', nextStatus: 'INTERESTED', reason: 'Reply is positive but does not contain a concrete buying signal.' };
  return { intent: 'UNKNOWN', nextStatus: current.status === 'CONTACTED' ? 'CONTACTED' : current.status, reason: 'No reliable buying-intent signal was detected.' };
}
