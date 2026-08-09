import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

const APOLLO_ORGANIZATION_SEARCH = 'https://api.apollo.io/api/v1/mixed_companies/search';

type ApolloOrganization = {
  name?: string;
  website_url?: string;
  primary_domain?: string;
  phone?: string;
  primary_phone?: { number?: string };
  organization_city?: string;
  organization_country?: string;
  city?: string;
  country?: string;
  industry?: string;
  short_description?: string;
};

export class ApolloLeadProvider implements LeadProvider {
  constructor(private readonly apiKey: string) {}

  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const params = new URLSearchParams();
    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    params.set('page', '1');
    params.set('per_page', String(limit));

    const location = query.city || query.country;
    if (location) params.append('organization_locations[]', location);

    // A LeadPilot free-text search such as "Laptop" is a market/topic search,
    // not necessarily an exact company name. Apollo's keyword-tag filter is the
    // appropriate organization search field for that use case.
    if (query.keywords) params.append('q_organization_keyword_tags[]', query.keywords);
    if (query.industry) params.append('q_organization_keyword_tags[]', query.industry);

    const response = await fetch(`${APOLLO_ORGANIZATION_SEARCH}?${params.toString()}`, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-api-key': this.apiKey,
      },
      body: JSON.stringify({}),
      cache: 'no-store',
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Apollo lead search failed (${response.status})${detail ? `: ${detail.slice(0, 180)}` : ''}`);
    }

    const data = await response.json() as { organizations?: ApolloOrganization[] };
    const organizations = Array.isArray(data.organizations) ? data.organizations : [];

    return organizations
      .filter((org) => typeof org.name === 'string' && org.name.trim())
      .map((org) => ({
        name: org.name!.trim(),
        website: org.website_url || (org.primary_domain ? `https://${org.primary_domain}` : undefined),
        phone: org.primary_phone?.number || org.phone,
        city: org.organization_city || org.city,
        country: org.organization_country || org.country,
        industry: org.industry || query.industry,
        source: 'Apollo',
      }));
  }
}
