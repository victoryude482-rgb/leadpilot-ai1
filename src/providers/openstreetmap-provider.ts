import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];
const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'LeadPilotAI/0.2 (+https://github.com/victoryude482-rgb/leadpilot-ai1)';

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  tags?: Record<string, string>;
  center?: { lat?: number; lon?: number };
  lat?: number;
  lon?: number;
}

interface GeocodeResult {
  osm_type?: string;
  osm_id?: number;
  display_name?: string;
  boundingbox?: [string, string, string, string];
}

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

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function inferIndustry(tags: Record<string, string>, fallback?: string): string | undefined {
  const shop = tags.shop;
  const office = tags.office;
  const amenity = tags.amenity;
  const tourism = tags.tourism;
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
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  if (!name) return null;

  return {
    name,
    website: tags.website || tags['contact:website'],
    phone: tags.phone || tags['contact:phone'],
    email: tags.email || tags['contact:email'],
    address: [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ') || undefined,
    city: tags['addr:city'] || query.city,
    country: tags['addr:country'] || query.country,
    industry: inferIndustry(tags, query.industry),
    source: 'OpenStreetMap',
  };
}

function buildTagQueries(query: LeadSearchQuery): string[] {
  const text = [query.keywords, query.industry].filter(Boolean).join(' ');
  const matched = TAG_PATTERNS.find((entry) => entry.pattern.test(text));
  return matched?.tags ?? ['shop', 'office', 'amenity~"^(business_centre|coworking_space)$"'];
}

async function geocode(location: string): Promise<GeocodeResult | null> {
  const url = new URL(NOMINATIM_ENDPOINT);
  url.searchParams.set('q', location);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  const response = await fetch(url, {
    headers: { accept: 'application/json', 'user-agent': USER_AGENT },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = await response.json() as GeocodeResult[];
  return data[0] ?? null;
}

function buildSearchArea(result: GeocodeResult): string {
  if (result.osm_type === 'relation' && result.osm_id) {
    return `area(${3600000000 + result.osm_id})`;
  }
  const box = result.boundingbox;
  if (!box || box.length !== 4) throw new Error('Could not determine the geographic area for that location.');
  const [south, north, west, east] = box.map(Number);
  return `bbox(${south},${west},${north},${east})`;
}

function buildOverpassQuery(searchArea: string, query: LeadSearchQuery, includeNameSearch: boolean): string {
  const keyword = query.keywords?.trim() || query.industry?.trim();
  const nameClause = includeNameSearch && keyword
    ? `nwr(${searchArea})[name~"${escapeRegex(keyword)}",i];`
    : '';
  const tagClauses = buildTagQueries(query)
    .map((tag) => `nwr(${searchArea})[${tag}];`)
    .join('\n');
  return `[out:json][timeout:25];\n(\n${nameClause}\n${tagClauses}\n);\nout center ${Math.min(Math.max(query.limit ?? 10, 1), 50)};`;
}

async function overpass(searchQuery: string): Promise<OverpassElement[]> {
  let lastError = '';
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          accept: 'application/json',
          'user-agent': USER_AGENT,
        },
        body: new URLSearchParams({ data: searchQuery }),
        cache: 'no-store',
      });
      if (!response.ok) {
        lastError = `Overpass ${response.status}`;
        continue;
      }
      const data = await response.json() as { elements?: OverpassElement[] };
      return data.elements ?? [];
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'network error';
    }
  }
  throw new Error(`OpenStreetMap search is temporarily unavailable${lastError ? ` (${lastError})` : ''}. Please try again.`);
}

export class OpenStreetMapLeadProvider implements LeadProvider {
  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const location = (query.city || query.country || '').trim();
    if (!location) throw new Error('Enter a city or country so LeadPilot can search a real geographic area.');

    const place = await geocode(location);
    if (!place) throw new Error(`I could not locate "${location}". Try a city such as Lagos or a country such as Nigeria.`);

    const searchArea = buildSearchArea(place);
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 50);

    let elements = await overpass(buildOverpassQuery(searchArea, query, false));
    if (!elements.length) {
      elements = await overpass(buildOverpassQuery(searchArea, query, true));
    }

    const records = elements
      .map((element) => mapElement(element, query))
      .filter((item): item is DiscoveredBusiness => Boolean(item));

    const seen = new Set<string>();
    return records.filter((record) => {
      const key = `${record.name.toLowerCase()}|${(record.city ?? '').toLowerCase()}|${(record.country ?? '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);
  }
}
