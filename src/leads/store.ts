import type { BusinessRecord, LeadRecord, LeadStatus } from './model';

export interface LeadStore {
  saveBusiness(business: BusinessRecord): Promise<BusinessRecord>;
  saveLead(lead: LeadRecord): Promise<LeadRecord>;
  updateStatus(accountId: string, leadId: string, status: LeadStatus): Promise<void>;
  listLeads(accountId: string): Promise<LeadRecord[]>;
}

/** Temporary development adapter. Replace with Supabase implementation without changing callers. */
export class MemoryLeadStore implements LeadStore {
  private businesses = new Map<string, BusinessRecord>();
  private leads = new Map<string, LeadRecord>();

  async saveBusiness(business: BusinessRecord) {
    this.businesses.set(business.id, business);
    return business;
  }

  async saveLead(lead: LeadRecord) {
    this.leads.set(lead.id, lead);
    return lead;
  }

  async updateStatus(accountId: string, leadId: string, status: LeadStatus) {
    const lead = this.leads.get(leadId);
    if (!lead || lead.accountId !== accountId) throw new Error('Lead not found');
    lead.status = status;
    lead.updatedAt = new Date().toISOString();
  }

  async listLeads(accountId: string) {
    return [...this.leads.values()].filter((lead) => lead.accountId === accountId);
  }
}
