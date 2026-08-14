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
    new RedditTrendProvider(),
    ...(agent === 'trend-finder' ? [new NewsTrendProvider()] : []),
  ];

  const keywordsByAgent: Record<typeof agent, string> = {
    'trend-finder': `emerging trend ${query} market demand news reddit`,
    'opportunity-finder': `${query} business opportunity pain points demand reddit companies need`,
    'tender-finder': `${query} tender procurement contract request for proposal reddit`,
    'ecommerce-opportunity': `${query} product demand customer complaints buying intent reddit ecommerce`,
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
      'Expanded the natural-language request into evidence-oriented search terms.',
      'Queried configured discovery providers plus Reddit as a community-demand signal.',
      agent === 'trend-finder'
        ? 'Included public news as an additional trend signal.'
        : 'Used Reddit to surface demand, pain points, and intent signals relevant to this agent.',
      'Provider failures are isolated as warnings; available sources can still return results.',
      'Returned only source-backed records; no synthetic opportunities were created.',
    ],
  };
}
