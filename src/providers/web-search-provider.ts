import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

function buildSearchQuery(query: LeadSearchQuery): string {
  const parts = [query.industry, query.keywords, query.city, query.country].filter(Boolean);
  return parts.join(' ');
}

function normaliseUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.trim()) return undefined;
  try { return new URL(value).toString(); } catch { return undefined; }
}

function titleToBusiness(title: string, url: string | undefined, source: string, query: LeadSearchQuery): DiscoveredBusiness {
  const cleaned = title.replace(/\s+/g, ' ').trim();
  return {
    name: cleaned.replace(/\s*[|–—-]\s*.*$/, '').trim() || cleaned,
    website: url,
    city: query.city,
    country: query.country,
    industry: query.industry,
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
    return (data.results ?? []).slice(0, query.limit ?? 20)
      .filter((item) => typeof item.title === 'string')
      .map((item) => titleToBusiness(item.title!, normaliseUrl(item.url), 'searxng', query));
  }
}

export class TavilyLeadProvider implements LeadProvider {
  constructor(private readonly apiKey: string, private readonly endpoint = 'https://api.tavily.com/search') {}
  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const response = await fetch(this.endpoint, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ api_key: this.apiKey, query: buildSearchQuery(query), search_depth: 'basic', max_results: Math.min(query.limit ?? 20, 20), include_answer: false }),
    });
    if (!response.ok) throw new Error(`Tavily search failed: ${response.status}`);
    const data = await response.json() as { results?: Array<{ title?: string; url?: string }> };
    return (data.results ?? []).filter((item) => typeof item.title === 'string')
      .map((item) => titleToBusiness(item.title!, normaliseUrl(item.url), 'tavily', query));
  }
}

/** No-key fallback for free deployments. */
export class DuckDuckGoLeadProvider implements LeadProvider {
  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const url = new URL('https://html.duckduckgo.com/html/');
    url.searchParams.set('q', buildSearchQuery(query));
    const response = await fetch(url, { headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': 'LeadPilotAI/0.3' } });
    if (!response.ok) throw new Error(`DuckDuckGo search failed: ${response.status}`);
    const html = await response.text();
    const records: DiscoveredBusiness[] = [];
    const pattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) && records.length < Math.min(query.limit ?? 20, 20)) {
      const title = match[2].replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim();
      let href = match[1];
      try {
        const parsed = new URL(href, 'https://html.duckduckgo.com');
        const uddg = parsed.searchParams.get('uddg');
        href = uddg ? decodeURIComponent(uddg) : parsed.toString();
      } catch { continue; }
      const website = normaliseUrl(href);
      if (title && website) records.push(titleToBusiness(title, website, 'duckduckgo', query));
    }
    return records;
  }
}
