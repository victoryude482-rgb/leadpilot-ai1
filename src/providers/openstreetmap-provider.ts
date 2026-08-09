import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

const OVERPASS_ENDPOINT = 'https://overpass-api.de/api/interpreter';
const USER_AGENT = 'LeadPilotAI/0.1 (+https://github.com/victoryude482-rgb/leadpilot-ai1)';

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  tags?: Record<string, string>;
  center?: { lat?: number; lon?: number };
  lat?: number;
  lon?: number;
}

const TAG_PATTERNS: Array<{ pattern: RegExp; tags: string[] }> = [
  { pattern: /laptop|computer|pc|electronics?|mobile|phone|tech|technology|it\b/i, tags: ['shop~"^(computer|electronics|mobile_phone|telecommunication)$"', 'office~"^(it|software|telecommunication)$"'] },
  { pattern: /fintech|finance|financial|bank/i, tags: ['amenity="bank"', 'office~"^(financial|insurance)$"'] },
  { pattern: /restaurant|food|cafe|coffee/i, tags: ['amenity~"^(restaurant|cafe|fast_food)$"'] },
  { pattern: /hotel|hospitality/i, tags: ['tourism="hotel"', 'tourism="guest_house"'] },
  { pattern: /school|education/i, tags: ['amenity~"^(school|college|university)$"'] },
  { pattern: /health|medical|hospital|clinic/i, tags: ['amenity~"^(hospital|clinic|doctors|pharmacy)$"'] },
  { pattern: /real.?estate|property/i, tags: ['office="estate_agent"'] },
  { pattern: /logistics|delivery|transport/i, tags: ['office~"^(logistics|transport)$"'] },
];

function escapeOverpass(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function inferIndustry(tags: Record<string, string>, fallback?: string): string | undefined {
  const shop = tags.shop;
  const office = tags.office;
  const amenity = tags.amenity;
  const tourism = tags.tourism;
  if (shop && /computer|electronics|mobile_phone|telecommunication/.test(shop)) return 'Technology';
  if (office && /it|software|telecommunication/.test(office)) return 'Technology';
  if (amenity === 'bank' || office === 'financial' || office === 'insurance') return 'Financial services';
  if (amenity && /restaurant|cafe|fast_food/.test(amenity)) return 'Food & hospitality';
  if (tourism && /hotel|guest_house/.test(tourism)) return 'Hospitality';
  if (amenity && /school|college|university/.test(amenity)) return 'Education';
  if (amenity && /hospital|clinic|doctors|pharmacy/.test(amenity)) return 'Healthcare';
  if (office === 'estate_agent') return 'Real estate';
  if (office && /logistics|transport/.test(office)) return 'Logistics & transport';
  return fallback;
}

function mapElement(element: OverpassElement, query: LeadSearchQuery): DiscoveredBusiness | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();
  if (!name) return null;

  const website = tags.website || tags['contact:website'];
  const phone = tags.phone || tags['contact:phone'];
  const email = tags.email || tags['contact:email'];
  const city = tags['addr:city'] || query.city;
  const country = tags['addr:country'] || query.country;
  const street = tags['addr:street'];
  const house = tags['addr:housenumber'];
  const address = [house, street].filter(Boolean).join(' ') || undefined;

  return {
    name,
    website,
    phone,
    email,
    address,
    city,
    country,
    industry: inferIndustry(tags, query.industry),
    source: 'OpenStreetMap',
  };
}

function buildTagQueries(query: LeadSearchQuery): string[] {
  const text = [query.keywords, query.industry].filter(Boolean).join(' ');
  const matched = TAG_PATTERNS.find((entry) => entry.pattern.test(text));
  return matched?.tags ?? ['shop', 'office', 'amenity~"^(business_centre|coworking_space)$"'];
}

export class OpenStreetMapLeadProvider implements LeadProvider {
  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const location = (query.city || query.country || '').trim();
    if (!location) throw new Error('Enter a city or country so LeadPilot can search a real geographic area.');

    const limit = Math.min(Math.max(query.limit ?? 10, 1), 50);
    const areaName = escapeOverpass(location);
    const keyword = query.keywords?.trim() || query.industry?.trim();
    const nameClause = keyword ? `nwr(area.searchArea)[name~"${escapeRegex(keyword)}",i];` : '';
    const tagClauses = buildTagQueries(query).map((tag) => `nwr(area.searchArea)[${tag}];`).join('\n');

    const q = `[out:json][timeout:20];\narea["name"="${areaName}"]["boundary"="administrative"]->.searchArea;\n(\n${nameClause}\n${tagClauses}\n);\nout center ${limit};`;

    const response = await fetch(OVERPASS_ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        accept: 'application/json',
        'user-agent': USER_AGENT,
      },
      body: new URLSearchParams({ data: q }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`OpenStreetMap search failed (${response.status})${detail ? `: ${detail.slice(0, 160)}` : ''}`);
    }

    const data = await response.json() as { elements?: OverpassElement[] };
    const records = (data.elements ?? []).map((element) => mapElement(element, query)).filter((item): item is DiscoveredBusiness => Boolean(item));

    const seen = new Set<string>();
    return records.filter((record) => {
      const key = `${record.name.toLowerCase()}|${(record.city ?? '').toLowerCase()}|${(record.country ?? '').toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, limit);
  }
}
