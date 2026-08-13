import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

export interface SearchResult {
  records: DiscoveredBusiness[];
  providerCount: number;
  warnings: string[];
}

// Keep individual sources responsive without making a slow source block the UI.
const PROVIDER_TIMEOUT_MS = 5000;

async function searchProviderFast(provider: LeadProvider, query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    return await Promise.race([
      provider.search(query),
      new Promise<never>((_, reject) => {
        const error = new Error(`Provider ${provider.constructor.name} timed out`);
        error.name = 'ProviderTimeout';
        setTimeout(() => reject(error), PROVIDER_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
    controller.abort();
  }
}

function dedupe(records: DiscoveredBusiness[]): DiscoveredBusiness[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    const key = [record.website, record.phone, record.email, record.name, record.address, record.city, record.country]
      .map((value) => (value ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''))
      .filter(Boolean)
      .slice(0, 4)
      .join('|');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rank(records: DiscoveredBusiness[]): DiscoveredBusiness[] {
  return [...records].sort((a, b) => {
    const score = (record: DiscoveredBusiness) =>
      (record.website ? 3 : 0) + (record.phone ? 2 : 0) + (record.email ? 2 : 0) +
      (record.address ? 1 : 0) + (record.city ? 1 : 0) + (record.country ? 1 : 0);
    return score(b) - score(a);
  });
}

export async function searchLeads(providers: LeadProvider[], query: LeadSearchQuery): Promise<SearchResult> {
  const enabled = providers.filter(Boolean);
  const warnings: string[] = [];
  const results = await Promise.allSettled(enabled.map((provider) => searchProviderFast(provider, query)));
  const records = results.flatMap((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    const provider = enabled[index];
    warnings.push(`${provider.constructor.name}: ${result.reason instanceof Error ? result.reason.message : 'search failed'}`);
    return [];
  });

  const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
  return {
    records: rank(dedupe(records)).slice(0, limit),
    providerCount: enabled.length,
    warnings,
  };
}
