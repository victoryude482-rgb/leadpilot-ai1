import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

function buildSearchQuery(query: LeadSearchQuery): string {
  const parts = [query.industry, query.keywords, query.city, query.country].filter(Boolean);
  return parts.join(' ');
}

function normaliseUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try {
    return new URL(value).toString();
  } catch {
    return undefined;
  }
}

function titleToBusiness(title: string, url?: string, source = 'web-search'): DiscoveredBusiness {
  const cleaned = title.replace(/\s+/g, ' ').trim();
  return {
    name: cleaned.replace(/\s*[|–—-]\s*.*$/, '').trim() || cleaned,
    website: url,
    city: undefined,
    country: undefined,
    industry: undefined,
    source,
  };
}

export class SearXNGLeadProvider implements LeadProvider {
  constructor(private readonly endpoint: string) {}

  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const base = new URL(this.endpoint);
    base.searchParams.set('q', buildSearchQuery(query));
    base.searchParams.set('format', 'json');
    base.searchParams.set('categories', 'general');

    const response = await fetch(base, { headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error(`SearXNG search failed: ${response.status}`);
    const data = await response.json() as { results?: Array<{ title?: string; url?: string }> };

    return (data.results ?? []).slice(0, query.limit ?? 20).filter((item) => typeof item.title === 'string')
      .map((item) => titleToBusiness(item.title!, normaliseUrl(item.url), 'searxng'));
  }
}

export class TavilyLeadProvider implements LeadProvider {
  constructor(private readonly apiKey: string, private readonly endpoint = 'https://api.tavily.com/search') {}

  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: this.apiKey,
        query: buildSearchQuery(query),
        search_depth: 'basic',
        max_results: Math.min(query.limit ?? 20, 20),
        include_answer: false,
      }),
    });
    if (!response.ok) throw new Error(`Tavily search failed: ${response.status}`);
    const data = await response.json() as { results?: Array<{ title?: string; url?: string }> };

    return (data.results ?? []).filter((item) => typeof item.title === 'string')
      .map((item) => titleToBusiness(item.title!, normaliseUrl(item.url), 'tavily'));
  }
}
