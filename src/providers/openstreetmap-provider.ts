import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'LeadPilotAI/0.3 (+https://github.com/victoryude482-rgb/leadpilot-ai1)';
const GEOCODE_TIMEOUT_MS = 3000;
const OVERPASS_TIMEOUT_MS = 7000;

interface OverpassElement { type: 'node' | 'way' | 'relation'; id: number; tags?: Record<string, string>; center?: { lat?: number; lon?: number }; lat?: number; lon?: number; }
interface GeocodeResult { osm_type?: string; osm_id?: number; display_name?: string; boundingbox?: [string, string, string, string]; }

const TAG_PATTERNS: Array<{ pattern: RegExp; tags: string[] }> = [
  { pattern: /laptop|computer|pc|electronics?|mobile|phone|tech|technology|it\b/i, tags: ['shop~"^(computer|electronics|mobile_phone|telecommunication)$"', 'office~"^(it|software|telecommunication)$"'] },
  { pattern: /fintech|finance|financial|bank/i, tags: ['amenity="bank"', 'office~"^(financial|insurance)$"'] },
  { pattern: /restaurant|food|cafe|coffee/i, tags: ['amenity~"^(restaurant|cafe|fast_food)$"'] },
  { pattern: /hotel|hospitality/i, tags: ['tourism="hotel"', 'tourism="guest_house"'] },
  { pattern: /school|education/i, tags: ['amenity~"^(school|college|university)$"'] },
  { pattern: /health|medical|hospital|clinic/i, tags: ['amenity~"^(hospital|clinic|doctors|pharmacy)$"'] },
  { pattern: /real.?estate|property|house|housing/i, tags: ['office="estate_agent"', 'shop="estate_agent"'] },
  { pattern: /logistics|delivery|transport/i, tags: ['office~"^(logistics|transport)$"'] },
];

function escapeRegex(value: string): string { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function inferIndustry(tags: Record<string, string>, fallback?: string): string | undefined {
  const shop = tags.shop, office = tags.office, amenity = tags.amenity, tourism = tags.tourism;
  if (shop && /computer|electronics|mobile_phone|telecommunication/.test(shop)) return 'Technology';
  if (shop === 'estate_agent' || office === 'estate_agent') return 'Real estate';
  if (office && /it|software|telecommunication/.test(office)) return 'Technology';
  if (amenity === 'bank' || office === 'financial' || office === 'insurance') return 'Financial services';
  if (amenity && /restaurant|cafe|fast_food/.test(amenity)) return 'Food & hospitality';
  if (tourism && /hotel|guest_house/.test(tourism)) return 'Hospitality';
  if (amenity && /school|college|university/.test(amenity)) return 'Education';
  if (amenity && /hospital|clinic|doctors|pharmacy/.test(amenity)) return 'Healthcare';
  if (office && /logistics|transport/.test(office)) return 'Logistics & transport';
  return fallback;
}
function mapElement(element: OverpassElement, query: LeadSearchQuery): DiscoveredBusiness | null {
  const tags = element.tags ?? {}, name = tags.name?.trim();
  if (!name) return null;
  return { name, website: tags.website || tags['contact:website'], phone: tags.phone || tags['contact:phone'], email: tags.email || tags['contact:email'], address: [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') || undefined, city: tags['addr:city'] || query.city, country: tags['addr:country'] || query.country, industry: inferIndustry(tags, query.industry), source: 'OpenStreetMap' };
}
function buildTagQueries(query: LeadSearchQuery): string[] {
  const text = [query.keywords, query.industry].filter(Boolean).join(' ');
  return TAG_PATTERNS.find((entry) => entry.pattern.test(text))?.tags ?? ['shop', 'office~"^(company|consulting)$"', 'amenity~"^(business_centre|coworking_space)$"'];
}
async function fetchWithTimeout(url: string | URL, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...init, signal: controller.signal }); } finally { clearTimeout(timer); }
}
async function geocode(location: string): Promise<GeocodeResult | null> {
  const url = new URL(NOMINATIM_ENDPOINT); url.searchParams.set('q', location); url.searchParams.set('format', 'json'); url.searchParams.set('limit', '1');
  try { const response = await fetchWithTimeout(url, { headers: { accept: 'application/json', 'user-agent': USER_AGENT }, cache: 'no-store' }, GEOCODE_TIMEOUT_MS); if (!response.ok) return null; const data = await response.json() as GeocodeResult[]; return data[0] ?? null; } catch { return null; }
}
function buildSearchArea(result: GeocodeResult): string {
  if (result.osm_type === 'relation' && result.osm_id) return `area(${3600000000 + result.osm_id})`;
  const box = result.boundingbox; if (!box || box.length !== 4) throw new Error('Could not determine the geographic area for that location.');
  const [south, north, west, east] = box.map(Number); return `bbox(${south},${west},${north},${east})`;
}
function buildOverpassQuery(searchArea: string, query: LeadSearchQuery, includeNameSearch: boolean): string {
  const keyword = query.keywords?.trim() || query.industry?.trim();
  const nameClause = includeNameSearch && keyword ? `nwr(${searchArea})[name~"${escapeRegex(keyword)}",i];` : '';
  const tagClauses = buildTagQueries(query).map((tag) => `nwr(${searchArea})[${tag}];`).join('\n');
  const limit = Math.min(Math.max(query.limit ?? 10, 1), 50);
  return `[out:json][timeout:6];\n(\n${nameClause}\n${tagClauses}\n);\nout center ${limit};`;
}
async function overpass(searchQuery: string): Promise<OverpassElement[]> {
  const attempts = OVERPASS_ENDPOINTS.map(async (endpoint) => {
    const response = await fetchWithTimeout(endpoint, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', accept: 'application/json', 'user-agent': USER_AGENT }, body: new URLSearchParams({ data: searchQuery }).toString(), cache: 'no-store' }, OVERPASS_TIMEOUT_MS);
    if (!response.ok) throw new Error(`Overpass ${response.status}`);
    const data = await response.json() as { elements?: OverpassElement[] }; return data.elements ?? [];
  });
  try { return await Promise.any(attempts); } catch { throw new Error('All OpenStreetMap search sources were unavailable'); }
}

export class OpenStreetMapLeadProvider implements LeadProvider {
  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const location = [query.city, query.country].filter(Boolean).join(', ');
    if (!location) throw new Error('OpenStreetMap requires a city or country.');
    const geocoded = await geocode(location); if (!geocoded) throw new Error(`Could not locate ${location}.`);
    const primary = await overpass(buildOverpassQuery(buildSearchArea(geocoded), query, true));
    return primary.map((element) => mapElement(element, query)).filter((value): value is DiscoveredBusiness => Boolean(value)).slice(0, Math.min(Math.max(query.limit ?? 10, 1), 50));
  }
}
