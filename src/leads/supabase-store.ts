import type { BusinessRecord, LeadRecord, LeadStatus } from './model';
import type { LeadStore } from './store';

export interface SupabaseStoreConfig {
  url: string;
  serviceRoleKey: string;
}

export class SupabaseLeadStore implements LeadStore {
  constructor(private readonly config: SupabaseStoreConfig) {}

  private async request(path: string, init: RequestInit = {}) {
    const response = await fetch(`${this.config.url.replace(/\/$/, '')}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: this.config.serviceRoleKey,
        Authorization: `Bearer ${this.config.serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
    return response;
  }

  async saveBusiness(business: BusinessRecord) {
    const response = await this.request('businesses?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(business),
    });
    return (await response.json())[0] as BusinessRecord;
  }

  async saveLead(lead: LeadRecord) {
    const response = await this.request('leads?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(lead),
    });
    return (await response.json())[0] as LeadRecord;
  }

  async updateStatus(accountId: string, leadId: string, status: LeadStatus) {
    await this.request(`leads?id=eq.${encodeURIComponent(leadId)}&account_id=eq.${encodeURIComponent(accountId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, updatedAt: new Date().toISOString() }),
    });
  }

  async listLeads(accountId: string) {
    const response = await this.request(`leads?account_id=eq.${encodeURIComponent(accountId)}&order=createdAt.desc`);
    return (await response.json()) as LeadRecord[];
  }
}
