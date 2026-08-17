import { RedditTrendProvider } from '../providers/reddit-trend-provider';
import { NewsTrendProvider } from '../providers/news-trend-provider';
import type { LeadProvider, LeadSearchQuery, DiscoveredBusiness } from '../providers/lead-provider';
import { configuredLeadProviders } from '../providers/configured-provider';
import { runLeadFinderPipeline, type FinderPipelineResult } from '../pipeline/lead-finder-pipeline';
import { researchWeb, type ResearchSource } from '../research/web-research';

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
  research?: { answer: string; sources: ResearchSource[]; queries: string[] };
}

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'also', 'been', 'being', 'business', 'businesses',
  'could', 'from', 'have', 'into', 'more', 'most', 'over', 'people', 'that',
  'their', 'there', 'these', 'they', 'this', 'those', 'through', 'today',
  'trend', 'trends', 'what', 'when', 'where', 'which', 'while', 'with',
  'would', 'your', 'news', 'market', 'markets', 'company', 'companies',
  'automation', 'opportunities', 'opportunity', 'research', 'latest',
]);

function words(value: string): string[] {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/)
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word) && !/^\d+$/.test(word));
}

export function extractTrendSignals(records: DiscoveredBusiness[], limit = 10): TrendSignal[] {
  const frequency = new Map<string, number>();
  const normalized = records.map((record) => {
    const title = record.name.trim();
    const tokens = [...new Set(words(title))];
    for (const token of tokens) frequency.set(token, (frequency.get(token) ?? 0) + 1);
    return { record, title, tokens };
  });
  return normalized.map(({ record, title, tokens }) => {
    const repeated = tokens.reduce((sum, token) => sum + Math.min(frequency.get(token) ?? 1, 3), 0);
    const sourceBoost = record.source === 'reddit' ? 2 : 1;
    return {
      title,
      source: record.source === 'reddit' ? 'reddit' : 'google-news-rss',
      url: record.website,
      community: record.source === 'reddit' ? record.address : undefined,
      relevance: Math.min(100, 20 + repeated * 6 + sourceBoost * 5),
    } satisfies TrendSignal;
  }).sort((a, b) => b.relevance - a.relevance).slice(0, Math.max(1, limit));
}

function trendKeywords(trends: TrendSignal[], original: LeadSearchQuery, researchSources: ResearchSource[] = []): string {
  const counts = new Map<string, number>();
  for (const trend of trends) for (const token of words(trend.title)) counts.set(token, (counts.get(token) ?? 0) + 1);
  for (const source of researchSources) for (const token of words(`${source.title} ${source.snippet ?? ''}`)) counts.set(token, (counts.get(token) ?? 0) + 1);
  const repeated = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([token]) => token);
  return [...new Set([original.industry, original.keywords, ...repeated].filter(Boolean))].join(' ').trim();
}

function researchQuestionFor(query: LeadSearchQuery): string {
  const subject = [query.industry, query.keywords, query.city, query.country].filter(Boolean).join(' ');
  return `Research ${subject || 'business opportunities'}: identify current demand, recurring customer problems, automation opportunities, buying signals, risks, and the types of businesses most likely to need solutions. Use recent web, news, and community evidence.`;
}

export async function findLeadsFromTrends(
  accountId: string,
  query: LeadSearchQuery,
  providers: LeadProvider[] = configuredLeadProviders(),
): Promise<TrendLeadResult> {
  const warnings: string[] = [];

  // Research first: understand the opportunity before choosing lead-search terms.
  let research: TrendLeadResult['research'];
  try {
    const intelligence = await researchWeb(researchQuestionFor(query));
    research = { answer: intelligence.answer, sources: intelligence.sources, queries: intelligence.queries };
    warnings.push(...intelligence.warnings);
  } catch (error) {
    warnings.push(`Research intelligence unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }

  const trendProviders = [new RedditTrendProvider(), new NewsTrendProvider()];
  const settled = await Promise.allSettled(trendProviders.map((provider) => provider.search(query)));
  const trendRecords: DiscoveredBusiness[] = [];
  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') trendRecords.push(...result.value);
    else warnings.push(`${trendProviders[index].constructor.name}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
  });

  const trends = extractTrendSignals(trendRecords, Math.min(Math.max(query.limit ?? 10, 1), 20));
  if (!trends.length) warnings.push('No public Reddit/news trend signals were available; business discovery was not replaced with synthetic trends.');

  const leadQuery: LeadSearchQuery = {
    ...query,
    keywords: trendKeywords(trends, query, research?.sources) || query.keywords || query.industry || 'business',
    limit: Math.min(Math.max(query.limit ?? 25, 1), 100),
  };

  const discovered = await runLeadFinderPipeline(accountId, providers, leadQuery);
  warnings.push(...discovered.warnings);

  return {
    trends,
    results: discovered.results,
    warnings: [...new Set(warnings)],
    strategy: [
      'Researched the opportunity before lead discovery using multiple public source types.',
      'Queried Reddit and public Google News RSS for current trend signals.',
      'Extracted repeated demand/problem terms from research evidence and trend titles.',
      'Sent the evidence-derived terms to real-business discovery providers.',
      'Verification and transparent lead scoring still run after discovery.',
      'Reddit/news records are signals only and are never persisted as leads.',
    ],
    research,
  };
}
