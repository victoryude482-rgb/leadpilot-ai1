import { handleLeadFinder, type AuthContext } from '../api/lead-finder-handler';
import { configuredLeadProviders } from '../providers/configured-provider';
import { getAgent } from './registry';
import type { AgentName } from '../../docs/agent-contract';

export interface AgentRunInput {
  agent: AgentName;
  query: string;
  location?: string;
  industry?: string;
  country?: string;
  city?: string;
  limit?: number;
}

/** Central runtime: the UI can select an agent without knowing its implementation. */
export async function runAgent(auth: AuthContext | null, input: AgentRunInput) {
  const definition = getAgent(input.agent);
  if (!definition) return { status: 404, body: { error: 'Unknown agent.' } };

  if (input.agent === 'lead-finder') {
    const result = await handleLeadFinder(auth, {
      keywords: input.query,
      industry: input.industry,
      country: input.country,
      city: input.city || input.location,
      limit: input.limit,
    }, configuredLeadProviders());
    return { status: result.status, body: { agent: definition, ...result.body } };
  }

  return {
    status: 200,
    body: {
      agent: definition,
      status: 'ready-for-source-adapters',
      query: input.query,
      message: `${definition.name} is registered and ready. Dedicated source adapters are the next activation step; no synthetic results are returned.`,
      results: [],
    },
  };
}
