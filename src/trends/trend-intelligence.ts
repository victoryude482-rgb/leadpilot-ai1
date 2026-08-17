import { RedditTrendProvider } from '../providers/reddit-trend-provider';
import { NewsTrendProvider } from '../providers/news-trend-provider';
import type { LeadProvider, LeadSearchQuery, DiscoveredBusiness } from '../providers/lead-provider';
import { configuredLeadProviders } from '../providers/configured-provider';
import { runLeadFinderPipeline, type FinderPipelineResult } from '../pipeline/lead-finder-pipeline';

export interface TrendSignal {
  title: string;
  source: 'reddit' | 'google-news-rss';
  url?: string;
  community?: string;
  relevance: number;
}

export interface TrendLeadResult {
  trends: TrendSignal[];
  results: FinderPipelineResult[];
  warnings: string[];
  strategy: string[];
}

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'been', 'being', 'business', 'businesses',
  'could', 'from', 'have', 'into', 'more', 'most', 'over', 'people', 'that',
  'their', 'there', 'these', 'they', 'this', 'those', 'through', 'today',
  'trend', 'trends', 'what', 'when', 'where', 'which', 'while', 'with',
  'would', 'your', 'news', 'market', 'markets', 'company', 'companies',
]);

function words(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word) && !/^\d+$/.test(word));
}

/** Turns public Reddit/news titles into repeatable niche signals without treating posts as leads. */
export function extractTrendSignals(records: DiscoveredBusiness[], limit = 10): TrendSignal[] {
  const frequency = new Map<string, number>();
  const normalized = records.map((record) => {
    const title = record.name.trim();
    const tokens = [...new Set(words(title))];
    for (const token of tokens) frequency.set(token, (frequency.get(token) ?? 0) + 1);
    return { record, title, tokens };
  });

  return normalized
    .map(({ record, title, tokens }) => {
      const repeated = tokens.reduce((sum, token) => sum + Math.min(frequency.get(token) ?? 1, 3), 0);
      const sourceBoost = record.source === 'reddit' ? 2 : 1;
      const relevance = Math.min(100, 20 + repeated * 6 + sourceBoost * 5);
      return {
        title,
        source: record.source === 'reddit' ? 'reddit' : 'google-news-rss',
        url: record.website,
        community: record.source === 'reddit' ? record.address : undefined,
        relevance,
      } satisfies TrendSignal;
    })
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, Math.max(1, limit));
}

function trendKeywords(trends: TrendSignal[], original: LeadSearchQuery): string {
  const counts = new Map<string, number>();
  for (const trend of trends) {
    for (const token of words(trend.title)) counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  const repeated = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([token]) => token);
  return [...new Set([original.industry, original.keywords, ...repeated].filter(Boolean))].join(' ').trim();
}

/**
 * Trend-first discovery: read public trend signals, extract niche terms, then search
 * actual business providers. Reddit/news records never enter the lead database.
 */
export async function findLeadsFromTrends(
  accountId: string,
  query: LeadSearchQuery,
  providers: LeadProvider[] = configuredLeadProviders(),
): Promise<TrendLeadResult> {
  const trendProviders = [new RedditTrendProvider(), new NewsTrendProvider()];
  const settled = await Promise.allSettled(trendProviders.map((provider) => provider.search(query)));
  const trendRecords: DiscoveredBusiness[] = [];
  const warnings: string[] = [];

  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') trendRecords.push(...result.value);
    else warnings.push(`${trendProviders[index].constructor.name}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
  });

  const trends = extractTrendSignals(trendRecords, Math.min(Math.max(query.limit ?? 10, 1), 20));
  if (!trends.length) warnings.push('No public Reddit/news trend signals were available; business discovery was not replaced with synthetic trends.');

  const leadQuery: LeadSearchQuery = {
    ...query,
    keywords: trendKeywords(trends, query) || query.keywords || query.industry || 'business',
    limit: Math.min(Math.max(query.limit ?? 25, 1), 100),
  };

  const discovered = await runLeadFinderPipeline(accountId, providers, leadQuery);
  warnings.push(...discovered.warnings);

  return {
    trends,
    results: discovered.results,
    warnings,
    strategy: [
      'Queried Reddit and public Google News RSS in parallel for trend signals.',
      'Extracted repeated niche terms from public titles instead of treating posts as businesses.',
      'Sent the resulting niche terms to the real-business discovery providers.',
      'Verification and lead scoring still run after trend discovery.',
      'Reddit/news records are never persisted as leads.',
    ],
  };
}
