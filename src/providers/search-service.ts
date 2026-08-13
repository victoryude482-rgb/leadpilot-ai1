import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

export interface SearchResult {
  records: DiscoveredBusiness[];
  providerCount: number;
  warnings: string[];
}

const PROVIDER_TIMEOUT_MS = 3000;

async function searchProviderFast(provider: LeadProvider, query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
  return Promise.race([
    provider.search(query),
    new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        const error = new Error('provider timed out');
        error.name = 'ProviderTimeout';
        reject(error);
      }, PROVIDER_TIMEOUT_MS);
      timer.unref?.();
    }),
  ]);
}

function dedupe(records: DiscoveredBusiness[]): DiscoveredBusiness[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    const websiteKey = record.website?.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    const phoneKey = record.phone?.replace(/\D/g, '');
    const nameKey = record.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = websiteKey || phoneKey || `${nameKey}|${(record.city ?? '').toLowerCase()}|${(record.country ?? '').toLowerCase()}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function rank(records: DiscoveredBusiness[]): DiscoveredBusiness[] {
  return [...records].sort((a, b) => {
    const score = (record: DiscoveredBusiness) =>
      (record.website ? 4 : 0) + (record.phone ? 3 : 0) + (record.email ? 3 : 0) +
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
    const message = result.reason instanceof Error ? result.reason.message : 'search failed';
    warnings.push(`${provider.constructor.name}: ${message}`);
    return [];
  });

  const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
  return { records: rank(dedupe(records)).slice(0, limit), providerCount: enabled.length, warnings };
}
