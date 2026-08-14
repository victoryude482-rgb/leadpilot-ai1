import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

function tag(xml: string, name: string): string {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return match?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim() ?? '';
}

/** Public, no-key news discovery used by evidence agents when business directories time out. */
export class NewsTrendProvider implements LeadProvider {
  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const text = [query.keywords, query.industry, query.city, query.country].filter(Boolean).join(' ').trim() || 'business trends';
    const url = new URL('https://news.google.com/rss/search');
    url.searchParams.set('q', text);
    url.searchParams.set('hl', 'en-US');
    url.searchParams.set('gl', 'US');
    url.searchParams.set('ceid', 'US:en');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/rss+xml, application/xml, text/xml' }, cache: 'no-store' });
      if (!response.ok) throw new Error(`News search failed: ${response.status}`);
      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
      return items.slice(0, Math.min(query.limit ?? 20, 20)).map((item) => {
        const title = tag(item, 'title');
        const link = tag(item, 'link');
        const source = tag(item, 'source');
        return { name: title || 'News trend', website: link || undefined, industry: query.industry || source || 'Trending business signal', city: query.city, country: query.country, source: 'google-news-rss' };
      }).filter((item) => item.name !== 'News trend');
    } finally {
      clearTimeout(timer);
    }
  }
}
