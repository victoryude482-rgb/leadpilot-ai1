import type { AgentRunInput } from './runtime';
import { runEvidenceAgent } from './evidence-agent';
import type { AgentName } from '../../docs/agent-contract';

export type AgentHandoff = { from: AgentName | string; to: AgentName | string; reason: string; query: string; status: 'requested'|'completed'|'not-needed'; };

export async function requestAgentHelp(from: string, target: 'trend-finder'|'opportunity-finder', input: AgentRunInput): Promise<{handoff:AgentHandoff; result:unknown}> {
  const query = input.query.trim();
  const result = await runEvidenceAgent(target, query, { industry: input.industry, country: input.country, city: input.city || input.location, limit: Math.min(input.limit || 5, 5) });
  return { handoff: { from, to: target, reason: 'The primary agent needs broader evidence before making a recommendation.', query, status: 'completed' }, result };
}

export function humanize(text: string): string {
  return text.replace(/\butilize\b/gi, 'use').replace(/\bin order to\b/gi, 'to').replace(/\bleverage\b/gi, 'use').replace(/\bseamless\b/gi, 'smooth').replace(/\bcutting-edge\b/gi, 'modern').replace(/\bsolution\b/gi, 'approach');
}
