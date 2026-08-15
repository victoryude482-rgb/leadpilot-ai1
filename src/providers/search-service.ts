import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

export interface SearchResult {
  records: DiscoveredBusiness[];
  providerCount: number;
  warnings: string[];
}

const DEFAULT_TIMEOUT_MS = 7000;
const SLOW_PROVIDER_TIMEOUT_MS = 12000;
const STOP_WORDS = new Set(['find','show','give','tell','me','look','for','search','what','are','is','the','some','best','good','real','actual','business','businesses','company','companies','organization','organizations','near','in','and','with','please','leads','lead','customers','clients']);

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

function tokens(value?: string): string[] {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

function relevant(record: DiscoveredBusiness, query: LeadSearchQuery): boolean {
  const industry = tokens(query.industry);
  const keywordTokens = tokens(query.keywords);
  const wanted = [...new Set([...industry, ...keywordTokens])];
  if (!wanted.length) return true;

  const haystack = [record.name, record.industry, record.address, record.city, record.country].filter(Boolean).join(' ').toLowerCase();
  const hits = wanted.filter((token) => haystack.includes(token));

  // An explicit industry is a hard requirement. A plumber query must not return
  // restaurants merely because they are nearby or have a website.
  if (industry.length > 0 && !industry.some((token) => haystack.includes(token))) return false;

  // For keyword-only searches require meaningful overlap rather than accepting
  // arbitrary provider records. Location terms are handled by provider fields.
  if (industry.length === 0 && keywordTokens.length > 0) {
    const requiredHits = keywordTokens.length === 1 ? 1 : Math.max(1, Math.ceil(keywordTokens.length * 0.4));
    if (hits.length < requiredHits) return false;
  }
  return true;
}

function rank(records: DiscoveredBusiness[], query?: LeadSearchQuery): DiscoveredBusiness[] {
  return [...records].sort((a, b) => {
    const score = (record: DiscoveredBusiness) => {
      const q = query ? tokens(query.industry).concat(tokens(query.keywords)) : [];
      const haystack = [record.name, record.industry, record.address, record.city, record.country].filter(Boolean).join(' ').toLowerCase();
      const relevance = q.filter((token) => haystack.includes(token)).length * 5;
      return relevance + (record.website ? 4 : 0) + (record.phone ? 3 : 0) + (record.email ? 3 : 0) + (record.address ? 1 : 0) + (record.city ? 1 : 0) + (record.country ? 1 : 0);
    };
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
  const beforeRelevance = records.length;
  records = records.filter((record) => relevant(record, query));
  const removed = beforeRelevance - records.length;
  if (removed > 0) warnings.push(`${removed} provider records were rejected because they did not match the requested business type or keywords.`);

  // Broaden only the wording, never the business-type requirement. This keeps
  // recovery useful without turning unrelated businesses into leads.
  if (records.length === 0) {
    const broader = broadenQuery(query);
    const broaderRaw = await run(broader);
    const broaderRelevant = broaderRaw.filter((record) => relevant(record, query));
    records = broaderRelevant;
    if (broaderRelevant.length === 0 && broaderRaw.length > 0) warnings.push('Providers returned businesses, but none matched the requested business type. No unrelated leads were substituted.');
  }

  // Do not use a generic fallback. Returning five correct leads is better than
  // returning twenty unrelated businesses when the requested niche has only five
  // verified matches available from the configured sources.
  const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
  return { records: rank(dedupe(records), query).slice(0, limit), providerCount: enabled.length, warnings };
}
