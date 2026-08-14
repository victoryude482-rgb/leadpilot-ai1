import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

interface PhotonFeature { properties?: Record<string, unknown>; }
interface PhotonResponse { features?: PhotonFeature[]; }

/** Fast, no-key global place/business discovery backed by OpenStreetMap data. */
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
      const name = typeof p.name === 'string' ? p.name.trim() : '';
      if (!name) continue;
      const city = typeof p.city === 'string' ? p.city : query.city;
      const country = typeof p.country === 'string' ? p.country : query.country;
      const street = typeof p.street === 'string' ? p.street : undefined;
      const house = typeof p.housenumber === 'string' ? p.housenumber : undefined;
      results.push({ name, address: [house, street].filter(Boolean).join(' ') || undefined, city, country, industry: query.industry, source: 'photon' });
    }
    return results;
  }
}
