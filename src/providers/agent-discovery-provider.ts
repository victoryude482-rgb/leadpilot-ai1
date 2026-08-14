import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';
import { discoverLeads } from '../agents/lead-discovery';

/** Local multi-source discovery fallback. Keeps the provider contract stable while using the agent's OSM discovery engine. */
export class AgentDiscoveryLeadProvider implements LeadProvider {
  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const parts = [query.industry, query.keywords, query.city, query.country].filter(Boolean);
    const text = parts.join(' ').trim() || 'business';
    const rows = await discoverLeads(text, Math.min(Math.max(query.limit ?? 50, 1), 100));
    return rows.map((row) => ({
      name: row.name,
      website: row.website,
      phone: row.phone,
      address: row.address,
      city: row.city,
      country: row.country,
      industry: row.category,
      source: row.source,
    }));
  }
}
