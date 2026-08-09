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
