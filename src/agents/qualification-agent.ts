import type { BusinessRecord, LeadRecord } from '../leads/model';

export type Qualification = 'UNQUALIFIED' | 'QUALIFIED' | 'SALES_READY';

export interface QualificationResult {
  qualification: Qualification;
  score: number;
  questions: string[];
  nextAction: 'NURTURE' | 'FOLLOW_UP' | 'OFFER' | 'HUMAN_REVIEW';
}

export function qualifyLead(business: BusinessRecord, lead: LeadRecord, reply?: string): QualificationResult {
  const text = (reply ?? '').toLowerCase();
  const buyingSignals = ['interested', 'yes', 'price', 'pricing', 'cost', 'demo', 'meeting', 'call', 'how much', 'send details'];
  const negativeSignals = ['stop', 'unsubscribe', 'remove me', 'not interested', 'no thanks'];

  if (negativeSignals.some((s) => text.includes(s))) {
    return { qualification: 'UNQUALIFIED', score: 0, questions: [], nextAction: 'NURTURE' };
  }

  const signalCount = buyingSignals.filter((s) => text.includes(s)).length;
  const score = Math.min(100, lead.score * 0.6 + signalCount * 15 + (business.email ? 5 : 0));
  const qualification: Qualification = score >= 80 ? 'SALES_READY' : score >= 60 ? 'QUALIFIED' : 'UNQUALIFIED';

  return {
    qualification,
    score: Math.round(score),
    questions: qualification === 'SALES_READY' ? [] : [
      'What are you currently using to capture and follow up with enquiries?',
      'How many new enquiries do you typically receive each month?',
      'Would you prefer a quick demo or a written proposal?',
    ],
    nextAction: qualification === 'SALES_READY' ? 'OFFER' : qualification === 'QUALIFIED' ? 'FOLLOW_UP' : 'NURTURE',
  };
}
