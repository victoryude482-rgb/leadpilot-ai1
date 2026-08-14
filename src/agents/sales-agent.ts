import type { BusinessRecord, LeadRecord } from '../leads/model';
import type { ReliableLeadReport } from '../leads/reliable-report';

export type SalesIntent = 'COLD' | 'WARM' | 'HOT' | 'DO_NOT_CONTACT';
export type OutreachChannel = 'email' | 'phone' | 'website_form';

export interface SalesPlan {
  intent: SalesIntent;
  priority: number;
  offer: string;
  subject: string;
  message: string;
  followUps: Array<{ delayDays: number; message: string }>;
  channels: OutreachChannel[];
  reasons: string[];
}

function hasContact(business: BusinessRecord): boolean {
  return Boolean(business.email || business.phone || business.website);
}

export function buildSalesPlan(
  business: BusinessRecord,
  lead: LeadRecord,
  report: ReliableLeadReport,
): SalesPlan {
  if (!hasContact(business) || report.recommendation === 'LOW_CONFIDENCE') {
    return {
      intent: 'DO_NOT_CONTACT',
      priority: 0,
      offer: 'Manual review',
      subject: '',
      message: '',
      followUps: [],
      channels: [],
      reasons: ['Insufficient verified information for automated outreach.'],
    };
  }

  const signals = report.reasons.join(' ').toLowerCase();
  const hasAutomationSignal = signals.includes('booking') || signals.includes('appointment') || signals.includes('quote') || signals.includes('online');
  const intent: SalesIntent = lead.score >= 85 ? 'HOT' : lead.score >= 70 ? 'WARM' : 'COLD';
  const offer = hasAutomationSignal ? 'AI lead capture and follow-up automation' : 'AI sales and customer-response automation';
  const location = [business.city, business.country].filter(Boolean).join(', ');
  const subject = `A simple way ${business.name} could capture more enquiries`;
  const message = `Hi ${business.name} team,\n\nI noticed ${business.name}${location ? ` in ${location}` : ''} and found a few signals that suggest there may be an opportunity to improve how enquiries are captured and followed up.\n\nWe build ${offer.toLowerCase()} that can respond to prospects quickly and keep follow-ups organized.\n\nIf this is relevant, I can show you a short example for your business.\n\nBest,\nVictory AI`;

  return {
    intent,
    priority: Math.min(100, lead.score + (report.recommendation === 'PRIORITIZE' ? 10 : 0)),
    offer,
    subject,
    message,
    followUps: [
      { delayDays: 3, message: `Just following up on my note about ${offer.toLowerCase()}. Happy to send a quick example if useful.` },
      { delayDays: 7, message: `Last quick follow-up: if improving enquiry response or follow-up is a priority, I can prepare a simple example for ${business.name}.` },
    ],
    channels: business.email ? ['email'] : business.phone ? ['phone'] : ['website_form'],
    reasons: report.reasons,
  };
}
