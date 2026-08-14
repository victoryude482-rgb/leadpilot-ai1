import type { LeadRecord, LeadStatus } from '../leads/model';

export interface PipelineCounts {
  NEW: number;
  VERIFIED: number;
  CONTACTED: number;
  REPLIED: number;
  INTERESTED: number;
  MEETING: number;
  CUSTOMER: number;
  NOT_INTERESTED: number;
}

export function emptyPipelineCounts(): PipelineCounts {
  return { NEW: 0, VERIFIED: 0, CONTACTED: 0, REPLIED: 0, INTERESTED: 0, MEETING: 0, CUSTOMER: 0, NOT_INTERESTED: 0 };
}

export function summarizePipeline(leads: LeadRecord[]): PipelineCounts {
  const counts = emptyPipelineCounts();
  for (const lead of leads) counts[lead.status] += 1;
  return counts;
}

const allowedTransitions: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['VERIFIED', 'NOT_INTERESTED'],
  VERIFIED: ['CONTACTED', 'NOT_INTERESTED'],
  CONTACTED: ['REPLIED', 'NOT_INTERESTED'],
  REPLIED: ['INTERESTED', 'CONTACTED', 'NOT_INTERESTED'],
  INTERESTED: ['MEETING', 'CUSTOMER', 'NOT_INTERESTED'],
  MEETING: ['CUSTOMER', 'INTERESTED', 'NOT_INTERESTED'],
  CUSTOMER: [],
  NOT_INTERESTED: [],
};

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  return from === to || allowedTransitions[from].includes(to);
}

export function transitionLead(lead: LeadRecord, to: LeadStatus, at = new Date().toISOString()): LeadRecord {
  if (!canTransition(lead.status, to)) {
    throw new Error(`Invalid lead transition: ${lead.status} -> ${to}`);
  }
  return { ...lead, status: to, updatedAt: at };
}
