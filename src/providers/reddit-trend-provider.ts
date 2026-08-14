import type { LeadProvider, LeadSearchQuery, DiscoveredBusiness } from './lead-provider';

/** Server-side, read-only Reddit trend discovery. */
export class RedditTrendProvider implements LeadProvider {
  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const keywords = [query.keywords, query.industry, query.country, query.city].filter(Boolean).join(' ').trim();
    if (!keywords) return [];
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(keywords)}&sort=new&limit=${Math.min(Math.max(query.limit ?? 10, 1), 25)}`;
    const response = await fetch(url, { headers: { 'user-agent': 'LeadPilotAI/1.0 trend-research' }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`Reddit search failed: ${response.status}`);
    const data: unknown = await response.json();
    const children = (data as { data?: { children?: unknown[] } })?.data?.children;
    if (!Array.isArray(children)) return [];
    return children.flatMap((child): DiscoveredBusiness[] => {
      const post = (child as { data?: Record<string, unknown> })?.data;
      if (!post || typeof post.title !== 'string') return [];
      const permalink = typeof post.permalink === 'string' ? `https://www.reddit.com${post.permalink}` : undefined;
      const subreddit = typeof post.subreddit_name_prefixed === 'string' ? post.subreddit_name_prefixed : 'Reddit';
      return [{ name: post.title, website: permalink, address: subreddit, industry: query.industry, city: query.city, country: query.country, source: 'reddit' }];
    });
  }
}
