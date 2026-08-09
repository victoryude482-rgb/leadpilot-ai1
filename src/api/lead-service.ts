import { requireAccountAccess, type AuthContext } from '../auth/access';
import { processImportedLead } from './leadpilot';
import { MemoryLeadStore, type LeadStore } from '../leads/store';
import type { LeadRecord } from '../leads/model';

export class LeadService {
  constructor(private readonly store: LeadStore = new MemoryLeadStore()) {}

  async importOne(context: AuthContext | null, input: Record<string, unknown>, source: string, targetIndustry?: string): Promise<LeadRecord> {
    if (!context) throw new Error('Authentication required');
    const pipeline = processImportedLead(context.accountId, input, source, targetIndustry);
    if (!pipeline) throw new Error('Invalid lead');

    await this.store.saveBusiness(context.accountId, pipeline.business);
    const now = new Date().toISOString();
    const lead: LeadRecord = {
      id: crypto.randomUUID(),
      accountId: context.accountId,
      businessId: pipeline.business.id,
      status: 'NEW',
      score: pipeline.scoring.score,
      scoreLabel: pipeline.scoring.label,
      createdAt: now,
      updatedAt: now,
    };
    await this.store.saveLead(lead);
    return lead;
  }

  async list(context: AuthContext | null) {
    if (!context) throw new Error('Authentication required');
    requireAccountAccess(context, context.accountId);
    return this.store.listLeads(context.accountId);
  }
}
