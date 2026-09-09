import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

interface PhotonFeature { properties?: Record<string, unknown>; }
interface PhotonResponse { features?: PhotonFeature[]; }

// Photon indexes every named OSM feature - cities, streets, mountains, train
// stations, parks - not just businesses. Without filtering by osm_key, a
// search silently mixed these into the "leads" list, which is the root cause
// of leads that were not real businesses. This whitelist mirrors the
// business-relevant tag categories already used by OpenStreetMapLeadProvider.
const BUSINESS_OSM_KEYS = new Set(['shop', 'office', 'amenity', 'craft', 'tourism', 'leisure', 'healthcare']);

/** Fast, no-key global business discovery backed by OpenStreetMap data, restricted to business-tagged places. */
export class PhotonLeadProvider implements LeadProvider {
  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const url = new URL('https://photon.komoot.io/api/');
    const text = [query.keywords, query.industry, query.city, query.country].filter(Boolean).join(' ').trim();
    url.searchParams.set('q', text || 'business');
    url.searchParams.set('limit', String(Math.min(query.limit ?? 20, 20)));

    const response = await fetch(url, { headers: { accept: 'application/json', 'user-agent': 'LeadPilotAI/0.3' } });
    if (!response.ok) throw new Error(`Photon search failed: ${response.status}`);
    const data = await response.json() as PhotonResponse;
    const results: DiscoveredBusiness[] = [];

    for (const feature of data.features ?? []) {
      const p = feature.properties ?? {};
      const osmKey = typeof p.osm_key === 'string' ? p.osm_key : undefined;
      if (!osmKey || !BUSINESS_OSM_KEYS.has(osmKey)) continue;
      const name = typeof p.name === 'string' ? p.name.trim() : '';
      if (!name) continue;
      const city = typeof p.city === 'string' ? p.city : query.city;
      const country = typeof p.country === 'string' ? p.country : query.country;
      const street = typeof p.street === 'string' ? p.street : undefined;
      const house = typeof p.housenumber === 'string' ? p.housenumber : undefined;
      const osmValue = typeof p.osm_value === 'string' ? p.osm_value : undefined;
      results.push({ name, address: [house, street].filter(Boolean).join(' ') || undefined, city, country, industry: query.industry || osmValue, source: 'photon' });
    }
    return results;
  }
}
