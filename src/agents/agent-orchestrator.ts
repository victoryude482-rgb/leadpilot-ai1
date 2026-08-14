import type { BusinessRecord, LeadRecord } from '../leads/model';
import type { ReliableLeadReport } from '../leads/reliable-report';
import { buildSalesPlan, type SalesPlan } from './sales-agent';
import { qualifyLead, type QualificationResult } from './qualification-agent';

export interface AgentDecision {
  sales: SalesPlan;
  qualification: QualificationResult;
  next: 'OUTREACH' | 'FOLLOW_UP' | 'OFFER' | 'NURTURE' | 'HUMAN_REVIEW';
}

export function orchestrateLead(
  business: BusinessRecord,
  lead: LeadRecord,
  report: ReliableLeadReport,
  reply?: string,
): AgentDecision {
  const sales = buildSalesPlan(business, lead, report);
  const qualification = qualifyLead(business, lead, reply);

  if (sales.intent === 'DO_NOT_CONTACT') {
    return { sales, qualification, next: 'HUMAN_REVIEW' };
  }

  if (qualification.nextAction === 'OFFER') {
    return { sales, qualification, next: 'OFFER' };
  }

  if (reply) {
    return { sales, qualification, next: qualification.nextAction === 'FOLLOW_UP' ? 'FOLLOW_UP' : 'NURTURE' };
  }

  return { sales, qualification, next: 'OUTREACH' };
}
