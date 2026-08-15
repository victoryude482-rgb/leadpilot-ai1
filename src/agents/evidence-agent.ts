import { configuredLeadProviders } from '../providers/configured-provider';
import { NewsTrendProvider } from '../providers/news-trend-provider';
import { RedditTrendProvider } from '../providers/reddit-trend-provider';
import type { AgentName } from '../../docs/agent-contract';
import type { LeadProvider, LeadSearchQuery } from '../providers/lead-provider';
import { runLeadFinderPipeline } from '../pipeline/lead-finder-pipeline';

export interface EvidenceAgentResult {
  agent: AgentName;
  results: unknown[];
  warnings: string[];
  strategy: string[];
}

/** Evidence-first adapters; provider failures are warnings, not fatal agent errors. */
export async function runEvidenceAgent(
  agent: Extract<AgentName, 'trend-finder' | 'opportunity-finder' | 'tender-finder' | 'ecommerce-opportunity'>,
  query: string,
  fields: Pick<LeadSearchQuery, 'country' | 'city' | 'industry' | 'keywords' | 'limit'> = {},
  providers?: LeadProvider[],
): Promise<EvidenceAgentResult> {
  const sourceProviders = providers ?? configuredLeadProviders();
  const evidenceProviders = [
    ...sourceProviders,
    // Reddit is useful when available, but it is deliberately optional because public Reddit search can return 403.
    new RedditTrendProvider(),
    new NewsTrendProvider(),
  ];

  const keywordsByAgent: Record<typeof agent, string> = {
    'trend-finder': `current emerging trends ${query} market demand news`,
    'opportunity-finder': `${query} business opportunity customer demand pain points market gap companies`,
    'tender-finder': `${query} public tender procurement contract request for proposal government bid`,
    'ecommerce-opportunity': `${query} product demand customer buying intent ecommerce market opportunity`,
  };

  const search = await runLeadFinderPipeline('agent-research', evidenceProviders, {
    ...fields,
    keywords: keywordsByAgent[agent],
    limit: Math.min(Math.max(fields.limit ?? 20, 1), 100),
  });

  return {
    agent,
    results: search.results,
    warnings: search.warnings,
    strategy: [
      'Converted the natural-language request into broader evidence-oriented search terms.',
      'Queried multiple discovery sources in parallel instead of depending on one provider.',
      'Included public news as a second trend signal for every research agent.',
      'Reddit is optional; a Reddit 403 is reported as a warning and does not block the search.',
      'Provider failures are isolated so successful sources can still return readable results.',
      'Returned only source-backed records; no synthetic businesses or opportunities were invented.',
    ],
  };
}
