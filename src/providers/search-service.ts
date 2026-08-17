import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

export interface SearchResult { records: DiscoveredBusiness[]; providerCount: number; warnings: string[]; }
const DEFAULT_TIMEOUT_MS = 7000;
const SLOW_PROVIDER_TIMEOUT_MS = 12000;
const STOP_WORDS = new Set(['find','show','give','tell','me','look','search','what','are','is','the','some','best','good','real','actual','business','businesses','company','companies','organization','organizations','near','in','and','with','please','leads','lead','customers','clients','for']);
const COUNTRY_ALIASES: Record<string,string[]> = {
  'uk':['uk','united kingdom','great britain','england','scotland','wales','northern ireland','gb','gbr'], 'united kingdom':['uk','united kingdom','great britain','england','scotland','wales','northern ireland','gb','gbr'], 'gb':['uk','united kingdom','great britain','england','scotland','wales','northern ireland','gb','gbr'], 'gbr':['uk','united kingdom','great britain','england','scotland','wales','northern ireland','gb','gbr'], 'usa':['usa','united states','united states of america','us','u.s.','u.s.a.'], 'us':['usa','united states','united states of america','us','u.s.','u.s.a.'], 'canada':['canada','ca'], 'nigeria':['nigeria','ng'],
};
function providerTimeoutMs(provider: LeadProvider) { const name = provider.constructor.name.toLowerCase(); if (name.includes('openstreetmap') || name.includes('photon') || name.includes('agentdiscovery')) return SLOW_PROVIDER_TIMEOUT_MS; if (name.includes('duckduckgo')) return 6500; return DEFAULT_TIMEOUT_MS; }
async function searchProviderFast(provider: LeadProvider, query: LeadSearchQuery): Promise<DiscoveredBusiness[]> { const timeoutMs = providerTimeoutMs(provider); let timer: ReturnType<typeof setTimeout> | undefined; try { return await Promise.race([provider.search(query), new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`provider timed out after ${timeoutMs / 1000}s`)), timeoutMs); timer.unref?.(); })]); } finally { if (timer) clearTimeout(timer); } }
function dedupe(records: DiscoveredBusiness[]): DiscoveredBusiness[] { const seen = new Set<string>(); return records.filter((record) => { const websiteKey = record.website?.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, ''); const phoneKey = record.phone?.replace(/\D/g, ''); const nameKey = (record.name || '').toLowerCase().replace(/[^a-z0-9]/g, ''); const key = websiteKey || phoneKey || (nameKey ? `${nameKey}|${(record.city ?? '').toLowerCase()}|${(record.country ?? '').toLowerCase()}` : ''); if (!key || seen.has(key)) return false; seen.add(key); return true; }); }
function tokens(value?: string): string[] { return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter((t) => t.length >= 2 && !/^\d+$/.test(t) && !STOP_WORDS.has(t)); }
function variants(token: string): string[] { return token.endsWith('s') && token.length > 4 ? [token, token.slice(0, -1)] : [token]; }
function countryMatches(recordCountry: string|undefined, requestedCountry: string|undefined): boolean { if (!requestedCountry) return true; if (!recordCountry) return false; const wanted=requestedCountry.toLowerCase().trim(), actual=recordCountry.toLowerCase().trim(), aliases=COUNTRY_ALIASES[wanted]||[wanted], actualAliases=COUNTRY_ALIASES[actual]||[actual]; return aliases.some(a=>actualAliases.includes(a)||actual.includes(a)||a.includes(actual)); }
function cityMatches(record: DiscoveredBusiness, requestedCity: string|undefined): boolean { if (!requestedCity) return true; const wanted=tokens(requestedCity); if(!wanted.length)return true; const haystack=[record.city,record.address].filter(Boolean).join(' ').toLowerCase(); return wanted.every(t=>haystack.includes(t)); }
function locationMatches(record: DiscoveredBusiness, query: LeadSearchQuery): boolean { return countryMatches(record.country,query.country)&&cityMatches(record,query.city); }
function relevanceScore(record: DiscoveredBusiness, query: LeadSearchQuery): number { const wanted=[...new Set([...tokens(query.industry),...tokens(query.keywords)])]; if(!wanted.length)return 0; const haystack=[record.name,record.industry,record.address].filter(Boolean).join(' ').toLowerCase(); const hit=(token:string)=>variants(token).some(v=>haystack.includes(v)); return wanted.filter(hit).length*10+tokens(query.industry).filter(hit).length*8; }
function rank(records: DiscoveredBusiness[], query?: LeadSearchQuery): DiscoveredBusiness[] { return [...records].sort((a,b)=>{ const score=(r:DiscoveredBusiness)=>{const relevance=query?relevanceScore(r,query):0; return relevance+(r.website?4:0)+(r.phone?3:0)+(r.email?3:0)+(r.address?1:0)+(r.city?1:0)+(r.country?1:0);}; return score(b)-score(a);}); }
function broadenQuery(query: LeadSearchQuery): LeadSearchQuery { const cleaned=(query.keywords||'').replace(/\b(find|show|give|tell me|look for|search for|what are|what is|\d+)\b/gi,' ').replace(/\s+/g,' ').trim(); return {...query,keywords:[query.industry,cleaned].filter(Boolean).join(' ').trim()||'business'}; }
function semanticFallback(query: LeadSearchQuery): LeadSearchQuery[] {
  const raw=[query.keywords,query.industry].filter(Boolean).join(' ').trim();
  const location=[query.city,query.country].filter(Boolean).join(' ').trim();
  if(!raw) return [{...query,keywords:'business'}];
  return [{...query,keywords:raw},{...query,industry:undefined,keywords:`business ${raw}`},{...query,industry:undefined,keywords:location?`${raw} businesses ${location}`:`${raw} businesses`}];
}
export async function searchLeads(providers: LeadProvider[], query: LeadSearchQuery): Promise<SearchResult> {
  const enabled=providers.filter(Boolean); const warnings:string[]=[];
  const run=async(q:LeadSearchQuery)=>{const settled=await Promise.allSettled(enabled.map(p=>searchProviderFast(p,q)));return settled.flatMap((r,i)=>{if(r.status==='fulfilled')return r.value;warnings.push(`${enabled[i].constructor.name}: ${r.reason instanceof Error?r.reason.message:'search failed'}`);return [];});};
  let records=await run(query);
  if(!records.length) records=await run(broadenQuery(query));
  if(!records.length) { for(const fallback of semanticFallback(query)) { records=await run(fallback); if(records.length)break; } }
  const before=records.length; records=records.filter(r=>locationMatches(r,query));
  if(before>records.length) warnings.push(`${before-records.length} records rejected for wrong country or city.`);
  // If location filters eliminate everything, never invent a lead. A second location-aware pass can recover providers that omitted location metadata.
  if(!records.length && (query.city||query.country)) {
    const locationPass=await run({...query,industry:undefined,keywords:[query.keywords,query.industry,query.city,query.country].filter(Boolean).join(' ')});
    records=locationPass.filter(r=>locationMatches(r,query));
  }
  const limit=Math.min(Math.max(query.limit??25,1),100);
  return {records:rank(dedupe(records),query).slice(0,limit),providerCount:enabled.length,warnings};
}
