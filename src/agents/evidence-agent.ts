import { configuredLeadProviders } from '../providers/configured-provider';
import type { AgentName } from '../../docs/agent-contract';
import type { LeadProvider, LeadSearchQuery } from '../providers/lead-provider';
import { runLeadFinderPipeline } from '../pipeline/lead-finder-pipeline';

export interface EvidenceAgentResult {
  agent: AgentName;
  results: unknown[];
  warnings: string[];
  strategy: string[];
}

/**
 * Evidence-first adapters for research agents. These agents reuse the existing
 * multi-source discovery layer until specialized providers are configured.
 * They never manufacture opportunities, trends or tenders.
 */
export async function runEvidenceAgent(
  agent: Extract<AgentName, 'trend-finder' | 'opportunity-finder' | 'tender-finder' | 'ecommerce-opportunity'>,
  query: string,
  fields: Pick<LeadSearchQuery, 'country' | 'city' | 'industry' | 'keywords' | 'limit'> = {},
  providers?: LeadProvider[],
): Promise<EvidenceAgentResult> {
  const sourceProviders = providers ?? configuredLeadProviders();
  const keywordsByAgent: Record<typeof agent, string> = {
    'trend-finder': `emerging trend ${query} market demand news`,
    'opportunity-finder': `${query} business opportunity companies need`,
    'tender-finder': `${query} tender procurement contract request for proposal`,
    'ecommerce-opportunity': `${query} product demand market opportunity ecommerce`,
  };

  const search = await runLeadFinderPipeline('agent-research', sourceProviders, {
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
      'Queried the configured multi-source discovery providers in parallel.',
      'Returned only source-backed records; no synthetic opportunities were created.',
    ],
  };
}
