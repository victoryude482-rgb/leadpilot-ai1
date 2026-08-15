import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

export interface SearchResult {
  records: DiscoveredBusiness[];
  providerCount: number;
  warnings: string[];
}

const DEFAULT_TIMEOUT_MS = 7000;
const SLOW_PROVIDER_TIMEOUT_MS = 12000;

function providerTimeoutMs(provider: LeadProvider) {
  const name = provider.constructor.name.toLowerCase();
  if (name.includes('openstreetmap') || name.includes('photon') || name.includes('agentdiscovery')) return SLOW_PROVIDER_TIMEOUT_MS;
  if (name.includes('duckduckgo')) return 6500;
  return DEFAULT_TIMEOUT_MS;
}

async function searchProviderFast(provider: LeadProvider, query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
  const timeoutMs = providerTimeoutMs(provider);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      provider.search(query),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`provider timed out after ${timeoutMs / 1000}s`)), timeoutMs);
        timer.unref?.();
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function dedupe(records: DiscoveredBusiness[]): DiscoveredBusiness[] {
  const seen = new Set<string>();
  return records.filter((record) => {
    const websiteKey = record.website?.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    const phoneKey = record.phone?.replace(/\D/g, '');
    const nameKey = (record.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = websiteKey || phoneKey || (nameKey ? `${nameKey}|${(record.city ?? '').toLowerCase()}|${(record.country ?? '').toLowerCase()}` : '');
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

function broadenQuery(query: LeadSearchQuery): LeadSearchQuery {
  const original = query.keywords?.trim() || '';
  const cleaned = original
    .replace(/\b(find|show|give|tell me|look for|search for|what are|what is)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const keywords = [query.industry, cleaned, query.city, query.country].filter(Boolean).join(' ').trim();
  return { ...query, keywords: keywords || 'business companies organizations' };
}

export async function searchLeads(providers: LeadProvider[], query: LeadSearchQuery): Promise<SearchResult> {
  const enabled = providers.filter(Boolean);
  const warnings: string[] = [];

  const run = async (q: LeadSearchQuery) => {
    const settled = await Promise.allSettled(enabled.map((provider) => searchProviderFast(provider, q)));
    return settled.flatMap((result, index) => {
      if (result.status === 'fulfilled') return result.value;
      const provider = enabled[index];
      const message = result.reason instanceof Error ? result.reason.message : 'search failed';
      warnings.push(`${provider.constructor.name}: ${message}`);
      return [];
    });
  };

  let records = await run(query);

  // A natural-language request often contains instructions rather than searchable business terms.
  // Retry with a cleaned, broader query so one overly-specific request does not produce a blank dashboard.
  if (records.length === 0) {
    const broader = broadenQuery(query);
    if (broader.keywords !== query.keywords) records = await run(broader);
  }

  // One final generic fallback keeps public search useful even when a provider rejects the first phrase.
  if (records.length === 0) {
    const fallback: LeadSearchQuery = {
      ...query,
      keywords: [query.industry, query.city, query.country, 'business companies'].filter(Boolean).join(' ').trim() || 'business companies',
    };
    if (fallback.keywords !== query.keywords) records = await run(fallback);
  }

  const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
  return { records: rank(dedupe(records)).slice(0, limit), providerCount: enabled.length, warnings };
}
