import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

export interface SearchResult {
  records: DiscoveredBusiness[];
  providerCount: number;
  warnings: string[];
}

export async function searchLeads(providers: LeadProvider[], query: LeadSearchQuery): Promise<SearchResult> {
  const enabled = providers.filter(Boolean);
  const results = await Promise.allSettled(enabled.map((provider) => provider.search(query)));
  const records: DiscoveredBusiness[] = [];
  const warnings: string[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') records.push(...result.value);
    else warnings.push(result.reason instanceof Error ? result.reason.message : 'Lead provider failed');
  }

  const seen = new Set<string>();
  const unique = records.filter((record) => {
    const key = [record.name, record.website, record.city, record.country]
      .map((value) => (value ?? '').toLowerCase().trim())
      .join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { records: unique, providerCount: enabled.length, warnings };
}
