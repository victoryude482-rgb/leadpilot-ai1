import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

export class MultiSourceLeadProvider implements LeadProvider {
  constructor(private readonly providers: LeadProvider[]) {}

  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const results = await Promise.allSettled(this.providers.map((provider) => provider.search(query)));
    const merged: DiscoveredBusiness[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      if (result.status !== 'fulfilled') continue;
      for (const business of result.value) {
        const key = [business.name, business.city, business.country]
          .map((value) => String(value ?? '').trim().toLowerCase())
          .join('|');
        if (!business.name || seen.has(key)) continue;
        seen.add(key);
        merged.push(business);
      }
    }

    return merged;
  }
}
