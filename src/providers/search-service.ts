import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

export interface SearchResult { records: DiscoveredBusiness[]; providerCount: number; warnings: string[]; }
const DEFAULT_TIMEOUT_MS = 7000;
const SLOW_PROVIDER_TIMEOUT_MS = 12000;
const STOP_WORDS = new Set(['find','show','give','tell','me','look','search','what','are','is','the','some','best','good','real','actual','business','businesses','company','companies','organization','organizations','near','in','and','with','please','leads','lead','customers','clients','for']);
const COUNTRY_ALIASES: Record<string,string[]> = {
  'uk':['uk','united kingdom','great britain','england','scotland','wales','northern ireland','gb','gbr'],
  'united kingdom':['uk','united kingdom','great britain','england','scotland','wales','northern ireland','gb','gbr'],
  'gb':['uk','united kingdom','great britain','england','scotland','wales','northern ireland','gb','gbr'],
  'gbr':['uk','united kingdom','great britain','england','scotland','wales','northern ireland','gb','gbr'],
  'usa':['usa','united states','united states of america','us','u.s.','u.s.a.'],
  'us':['usa','united states','united states of america','us','u.s.','u.s.a.'],
  'canada':['canada','ca'],
  'nigeria':['nigeria','ng'],
};
function providerTimeoutMs(provider: LeadProvider) { const name = provider.constructor.name.toLowerCase(); if (name.includes('openstreetmap') || name.includes('photon') || name.includes('agentdiscovery')) return SLOW_PROVIDER_TIMEOUT_MS; if (name.includes('duckduckgo')) return 6500; return DEFAULT_TIMEOUT_MS; }
async function searchProviderFast(provider: LeadProvider, query: LeadSearchQuery): Promise<DiscoveredBusiness[]> { const timeoutMs = providerTimeoutMs(provider); let timer: ReturnType<typeof setTimeout> | undefined; try { return await Promise.race([provider.search(query), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`provider timed out after ${timeoutMs / 1000}s`)), timeoutMs); timer.unref?.(); })]); } finally { if (timer) clearTimeout(timer); } }
function dedupe(records: DiscoveredBusiness[]): DiscoveredBusiness[] { const seen = new Set<string>(); return records.filter((record) => { const websiteKey = record.website?.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, ''); const phoneKey = record.phone?.replace(/\D/g, ''); const nameKey = (record.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''); const key = websiteKey || phoneKey || (nameKey ? `${nameKey}|${(record.city ?? '').toLowerCase()}|${(record.country ?? '').toLowerCase()}` : ''); if (!key || seen.has(key)) return false; seen.add(key); return true; }); }
function tokens(value?: string): string[] { return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter((t) => t.length >= 2 && !/^\d+$/.test(t) && !STOP_WORDS.has(t)); }
function variants(token: string): string[] { return token.endsWith('s') && token.length > 4 ? [token, token.slice(0, -1)] : [token]; }
function countryMatches(recordCountry: string|undefined, requestedCountry: string|undefined): boolean {
  if (!requestedCountry) return true;
  if (!recordCountry) return false;
  const wanted = requestedCountry.toLowerCase().trim();
  const actual = recordCountry.toLowerCase().trim();
  const aliases = COUNTRY_ALIASES[wanted] || [wanted];
  const actualAliases = COUNTRY_ALIASES[actual] || [actual];
  return aliases.some((a) => actualAliases.includes(a) || actual.includes(a) || a.includes(actual));
}
function cityMatches(record: DiscoveredBusiness, requestedCity: string|undefined): boolean {
  if (!requestedCity) return true;
  const wanted=tokens(requestedCity); if(!wanted.length) return true;
  const haystack=[record.city,record.address].filter(Boolean).join(' ').toLowerCase();
  return wanted.every(t=>haystack.includes(t));
}
function relevant(record: DiscoveredBusiness, query: LeadSearchQuery): boolean {
  if (!countryMatches(record.country, query.country)) return false;
  if (!cityMatches(record, query.city)) return false;
  const industry = tokens(query.industry); const keywordTokens = tokens(query.keywords); const wanted = [...new Set([...industry, ...keywordTokens])];
  if (!wanted.length) return true;
  const haystack = [record.name, record.industry, record.address].filter(Boolean).join(' ').toLowerCase(); const hit = (token: string) => variants(token).some((v) => haystack.includes(v));
  if (industry.length > 0 && !industry.some(hit)) return false;
  if (industry.length === 0 && keywordTokens.length > 0 && !keywordTokens.some(hit)) return false;
  return true;
}
function rank(records: DiscoveredBusiness[], query?: LeadSearchQuery): DiscoveredBusiness[] { return [...records].sort((a, b) => { const q = query ? [...tokens(query.industry), ...tokens(query.keywords)] : []; const score = (record: DiscoveredBusiness) => { const haystack = [record.name, record.industry, record.address].filter(Boolean).join(' ').toLowerCase(); const relevance = q.reduce((n, token) => n + (variants(token).some((v) => haystack.includes(v)) ? 5 : 0), 0); return relevance + (record.website ? 4 : 0) + (record.phone ? 3 : 0) + (record.email ? 3 : 0) + (record.address ? 1 : 0) + (record.city ? 1 : 0) + (record.country ? 1 : 0); }; return score(b) - score(a); }); }
function broadenQuery(query: LeadSearchQuery): LeadSearchQuery { const cleaned = (query.keywords || '').replace(/\b(find|show|give|tell me|look for|search for|what are|what is|\d+)\b/gi, ' ').replace(/\s+/g, ' ').trim(); return { ...query, keywords: [query.industry, cleaned].filter(Boolean).join(' ').trim() || 'business' }; }
export async function searchLeads(providers: LeadProvider[], query: LeadSearchQuery): Promise<SearchResult> {
  const enabled = providers.filter(Boolean); const warnings: string[] = [];
  const run = async (q: LeadSearchQuery) => { const settled = await Promise.allSettled(enabled.map((provider) => searchProviderFast(provider, q))); return settled.flatMap((result, index) => { if (result.status === 'fulfilled') return result.value; const provider = enabled[index]; warnings.push(`${provider.constructor.name}: ${result.reason instanceof Error ? result.reason.message : 'search failed'}`); return []; }); };
  let records = await run(query); const before = records.length; records = records.filter((record) => relevant(record, query));
  if (before > records.length) warnings.push(`${before - records.length} records rejected for wrong business type, country, or city.`);
  if (records.length === 0) { const broaderRaw = await run(broadenQuery(query)); records = broaderRaw.filter((record) => relevant(record, query)); if (broaderRaw.length && !records.length) warnings.push(`Providers returned records, but none matched the requested business type/country/city. No unrelated leads were substituted.`); }
  const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
  return { records: rank(dedupe(records), query).slice(0, limit), providerCount: enabled.length, warnings };
}
