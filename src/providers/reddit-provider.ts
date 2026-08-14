import type { DiscoveredBusiness, LeadProvider, LeadSearchQuery } from './lead-provider';

interface RedditPost {
  title?: unknown;
  permalink?: unknown;
  subreddit?: unknown;
}

interface RedditSearchResponse {
  data?: { children?: Array<{ data?: RedditPost }> };
}

function searchText(query: LeadSearchQuery): string {
  return [query.keywords, query.industry, query.city, query.country].filter(Boolean).join(' ').trim();
}

function clean(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const text = value.replace(/\s+/g, ' ').trim();
  return text || undefined;
}

/** Public Reddit JSON search adapter for research and trend agents. */
export class RedditLeadProvider implements LeadProvider {
  constructor(private readonly endpoint = 'https://www.reddit.com/search.json') {}

  async search(query: LeadSearchQuery): Promise<DiscoveredBusiness[]> {
    const search = searchText(query);
    if (!search) return [];
    const url = new URL(this.endpoint);
    url.searchParams.set('q', search);
    url.searchParams.set('sort', 'new');
    url.searchParams.set('t', 'month');
    url.searchParams.set('limit', String(Math.min(query.limit ?? 20, 25)));
    url.searchParams.set('raw_json', '1');

    const response = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'LeadPilotAI/1.0 (research bot)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Reddit search failed: ${response.status}`);

    const data = await response.json() as RedditSearchResponse;
    return (data.data?.children ?? [])
      .map(child => child.data)
      .filter((post): post is RedditPost => Boolean(post))
      .map(post => {
        const title = clean(post.title);
        const subreddit = clean(post.subreddit);
        const permalink = clean(post.permalink);
        if (!title || !permalink) return null;
        return {
          name: title,
          website: `https://www.reddit.com${permalink}`,
          city: query.city,
          country: query.country,
          industry: query.industry,
          source: `reddit${subreddit ? `:${subreddit}` : ''}`,
        } satisfies DiscoveredBusiness;
      })
      .filter((item): item is DiscoveredBusiness => Boolean(item));
  }
}
