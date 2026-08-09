import type { ImportedLeadRow } from '../leads/model';

export interface LeadSearchQuery {
  industry?: string;
  country?: string;
  city?: string;
  keywords?: string;
  limit?: number;
}

export interface LeadProviderResult {
  records: ImportedLeadRow[];
  source: string;
  warnings: string[];
}

export interface LeadProvider {
  search(query: LeadSearchQuery): Promise<LeadProviderResult>;
}

/** Provider boundary: external sources can be plugged in without changing scoring/CRM code. */
export class ProviderRegistry {
  constructor(private readonly providers: LeadProvider[]) {}

  async searchAll(query: LeadSearchQuery): Promise<LeadProviderResult> {
    const results = await Promise.all(this.providers.map((provider) => provider.search(query)));
    return {
      source: results.map((r) => r.source).join(', '),
      records: results.flatMap((r) => r.records),
      warnings: results.flatMap((r) => r.warnings),
    };
  }
}

/** Generic HTTP adapter for a compliant, authorized provider API. */
export class ApiLeadProvider implements LeadProvider {
  constructor(private readonly endpoint: string, private readonly apiKey?: string) {}

  async search(query: LeadSearchQuery): Promise<LeadProviderResult> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify(query),
    });
    if (!response.ok) throw new Error(`Lead provider failed: ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error('Lead provider returned an invalid response');

    const records = data.filter((item): item is ImportedLeadRow =>
      typeof item === 'object' && item !== null && typeof (item as { name?: unknown }).name === 'string',
    );
    return { records, source: this.endpoint, warnings: [] };
  }
}
