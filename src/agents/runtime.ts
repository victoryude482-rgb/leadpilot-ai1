import { handleLeadFinder, type AuthContext } from '../api/lead-finder-handler';
import { configuredLeadProviders } from '../providers/configured-provider';
import { getAgent } from './registry';
import { runEvidenceAgent } from './evidence-agent';
import { planRecovery, technicalDecisionNeeded, type TechnicalDecision } from './self-healing';
import type { AgentName } from '../../docs/agent-contract';
import type { LeadSearchQuery } from '../providers/lead-provider';

const EVIDENCE_AGENTS = ['trend-finder', 'opportunity-finder', 'tender-finder', 'ecommerce-opportunity'] as const;
type EvidenceAgent = typeof EVIDENCE_AGENTS[number];
const isEvidenceAgent = (agent: AgentName): agent is EvidenceAgent => EVIDENCE_AGENTS.includes(agent as EvidenceAgent);

export interface AgentRunInput { agent: AgentName; query: string; location?: string; industry?: string; country?: string; city?: string; limit?: number; }

const searchableAgents = new Set<AgentName>(['lead-finder', ...EVIDENCE_AGENTS]);
type LeadSearchBody = { results?: unknown[]; warnings?: string[]; [key: string]: unknown };

async function runLeadFinderWithRecovery(auth: AuthContext | null, input: AgentRunInput, providers: ReturnType<typeof configuredLeadProviders>) {
  let current: LeadSearchQuery = { keywords: input.query || input.industry || 'business', industry: input.industry, country: input.country, city: input.city || input.location, limit: input.limit };
  const recoveryLog: string[] = [];
  const technicalDecisions: TechnicalDecision[] = [];
  let result = await handleLeadFinder(auth, current, providers);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const body = result.body as LeadSearchBody;
    const results = body.results ?? [];
    if (results.length > 0) break;
    const warnings = body.warnings ?? [];
    const decisions = planRecovery(current, warnings, results.length);
    for (const decision of decisions) { recoveryLog.push(decision.reason); if (decision.technicalDecision) technicalDecisions.push(decision.technicalDecision); }
    const next = decisions.find((decision) => decision.query && decision.action === 'broaden') ?? decisions.find((decision) => decision.query && decision.action === 'retry');
    if (!next?.query) break;
    current = { keywords: next.query.keywords || current.keywords || current.industry || 'business', industry: next.query.industry ?? current.industry, country: next.query.country ?? current.country, city: next.query.city ?? current.city, limit: next.query.limit ?? current.limit };
    result = await handleLeadFinder(auth, current, providers);
  }
  const body = result.body as LeadSearchBody;
  return { ...result, recovery: { autonomous: true, attempts: recoveryLog.length ? Math.min(recoveryLog.length, 3) : 1, actions: recoveryLog, technicalDecisionNeeded: technicalDecisionNeeded(body.warnings ?? []), technicalDecisions } };
}

async function runEvidenceWithRecovery(input: AgentRunInput) {
  let query = input.query;
  const recoveryLog: string[] = [];
  const technicalDecisions: TechnicalDecision[] = [];
  let result = await runEvidenceAgent(input.agent as EvidenceAgent, query, { industry: input.industry, country: input.country, city: input.city || input.location, limit: input.limit });
  for (let attempt = 0; attempt < 2 && result.results.length === 0; attempt += 1) {
    const decisions = planRecovery({ keywords: query, industry: input.industry, country: input.country, city: input.city || input.location, limit: input.limit }, result.warnings, result.results.length);
    for (const decision of decisions) { recoveryLog.push(decision.reason); if (decision.technicalDecision) technicalDecisions.push(decision.technicalDecision); }
    const next = decisions.find((decision) => decision.query && decision.action === 'broaden') ?? decisions.find((decision) => decision.query && decision.action === 'retry');
    if (!next?.query?.keywords) break;
    query = next.query.keywords;
    result = await runEvidenceAgent(input.agent as EvidenceAgent, query, { industry: input.industry, country: input.country, city: input.city || input.location, limit: input.limit });
  }
  return { ...result, recovery: { autonomous: true, attempts: recoveryLog.length ? Math.min(recoveryLog.length + 1, 3) : 1, actions: recoveryLog, technicalDecisionNeeded: technicalDecisionNeeded(result.warnings), technicalDecisions } };
}

export async function runAgent(auth: AuthContext | null, input: AgentRunInput) {
  const agent = getAgent(input.agent);
  if (!agent) return { status: 404, body: { error: `Unknown agent: ${input.agent}` } };
  if (searchableAgents.has(input.agent)) {
    const providers = configuredLeadProviders();
    if (input.agent === 'lead-finder') return runLeadFinderWithRecovery(auth, input, providers);
    return runEvidenceWithRecovery(input);
  }
  return agent.run({ query: input.query, location: input.location, industry: input.industry, country: input.country, city: input.city, limit: input.limit });
}
