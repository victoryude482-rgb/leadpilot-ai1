import type { BusinessRecord, LeadRecord, LeadStatus } from './model';
import type { LeadStore } from './store';

export interface SupabaseLikeClient {
  from(table: string): {
    upsert(values: Record<string, unknown>, options?: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>;
    select(columns?: string): { eq(column: string, value: string): Promise<{ data: unknown; error: { message: string } | null }> };
    update(values: Record<string, unknown>): { eq(column: string, value: string): { eq(column: string, value: string): Promise<{ error: { message: string } | null }> } };
  };
}

/** One store instance is scoped to one authenticated account. */
export class SupabaseLeadStore implements LeadStore {
  constructor(private readonly client: SupabaseLikeClient, private readonly accountId: string) {
    if (!accountId) throw new Error('accountId is required');
  }

  async saveBusiness(accountId: string, business: BusinessRecord) {
    if (accountId !== this.accountId) throw new Error('Forbidden');
    const { data, error } = await this.client.from('businesses').upsert({
      id: business.id,
      account_id: this.accountId,
      name: business.name,
      website: business.website,
      phone: business.phone,
      email: business.email,
      address: business.address,
      city: business.city,
      country: business.country,
      industry: business.industry,
      source: business.source,
    }, { onConflict: 'id' });
    if (error) throw new Error(`Failed to save business: ${error.message}`);
    return (data ?? business) as BusinessRecord;
  }

  async saveLead(lead: LeadRecord) {
    if (lead.accountId !== this.accountId) throw new Error('Forbidden');
    const { data, error } = await this.client.from('leads').upsert({
      id: lead.id,
      account_id: this.accountId,
      business_id: lead.businessId,
      status: lead.status,
      score: lead.score,
      score_label: lead.scoreLabel,
      updated_at: lead.updatedAt,
    }, { onConflict: 'id' });
    if (error) throw new Error(`Failed to save lead: ${error.message}`);
    return (data ?? lead) as LeadRecord;
  }

  async updateStatus(accountId: string, leadId: string, status: LeadStatus) {
    if (accountId !== this.accountId) throw new Error('Forbidden');
    const { error } = await this.client.from('leads').update({ status, updated_at: new Date().toISOString() }).eq('id', leadId).eq('account_id', this.accountId);
    if (error) throw new Error(`Failed to update lead status: ${error.message}`);
  }

  async listLeads(accountId: string) {
    if (accountId !== this.accountId) throw new Error('Forbidden');
    const { data, error } = await this.client.from('leads').select('*').eq('account_id', this.accountId);
    if (error) throw new Error(`Failed to list leads: ${error.message}`);
    return (data ?? []) as LeadRecord[];
  }
}
