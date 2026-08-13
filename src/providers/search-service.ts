import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

export interface SearchResult {
  records: DiscoveredBusiness[];
  providerCount: number;
  warnings: string[];
}

const PROVIDER_TIMEOUT_MS = 3500;

async function searchProviderFast(provider: LeadProvider, query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Provider timed out')), PROVIDER_TIMEOUT_MS);
  });
  return Promise.race([provider.search(query), timeout]);
}

export async function searchLeads(providers: LeadProvider[], query: LeadSearchQuery): Promise<SearchResult> {
  const enabled = providers.filter(Boolean);
  const settled = await Promise.allSettled(enabled.map((provider) => searchProviderFast(provider, query)));
  const records: DiscoveredBusiness[] = [];
  const warnings: string[] = [];

  for (const result of settled) {
    if (result.status === 'fulfilled') records.push(...result.value);
    else warnings.push(result.reason instanceof Error ? result.reason.message : 'Lead provider failed');
  }

  const seen = new Set<string>();
  const unique = records.filter((record) => {
    const key = [record.name, record.website, record.phone, record.city, record.country]
      .map((value) => (value ?? '').toLowerCase().trim())
      .join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
  return { records: unique.slice(0, limit), providerCount: enabled.length, warnings };
}
