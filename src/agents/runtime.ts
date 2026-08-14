import { handleLeadFinder, type AuthContext } from '../api/lead-finder-handler';
import { configuredLeadProviders } from '../providers/configured-provider';
import { getAgent } from './registry';
import { runEvidenceAgent } from './evidence-agent';
import type { AgentName } from '../../docs/agent-contract';

const EVIDENCE_AGENTS = ['trend-finder', 'opportunity-finder', 'tender-finder', 'ecommerce-opportunity'] as const;
type EvidenceAgent = typeof EVIDENCE_AGENTS[number];
const isEvidenceAgent = (agent: AgentName): agent is EvidenceAgent => EVIDENCE_AGENTS.includes(agent as EvidenceAgent);

export interface AgentRunInput { agent: AgentName; query: string; location?: string; industry?: string; country?: string; city?: string; limit?: number; }

export async function runAgent(auth: AuthContext | null, input: AgentRunInput) {
  const definition = getAgent(input.agent);
  if (!definition) return { status: 404, body: { error: 'Unknown agent.' } };
  if (!input.query?.trim()) return { status: 400, body: { error: 'A search request is required.' } };

  if (input.agent === 'lead-finder') {
    const result = await handleLeadFinder(auth, { keywords: input.query, industry: input.industry, country: input.country, city: input.city || input.location, limit: input.limit }, configuredLeadProviders());
    return { status: result.status, body: { agent: definition, ...result.body } };
  }

  if (isEvidenceAgent(input.agent)) {
    const result = await runEvidenceAgent(input.agent, input.query, { industry: input.industry, country: input.country, city: input.city || input.location, limit: input.limit });
    return { status: 200, body: { ...result, agent: definition, status: 'evidence-search-complete' } };
  }

  return { status: 200, body: { agent: definition, status: 'ready-for-source-adapters', query: input.query, message: `${definition.name} is registered and ready. Dedicated source adapters are the next activation step; no synthetic results are returned.`, results: [] } };
}
