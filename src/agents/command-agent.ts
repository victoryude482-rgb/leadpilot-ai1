import type { AgentName } from '../../docs/agent-contract';
import { runAgent, type AgentRunInput } from './runtime';

type CommandPlan = { agents: Exclude<AgentName, 'command-agent'>[]; query: string; explanation: string };

export function planCommand(command: string): CommandPlan {
  const query = command.trim();
  const text = query.toLowerCase();
  const agents: Exclude<AgentName, 'command-agent'>[] = [];
  const add = (agent: Exclude<AgentName, 'command-agent'>) => { if (!agents.includes(agent)) agents.push(agent); };

  const has = (...patterns: RegExp[]) => patterns.some(pattern => pattern.test(text));
  const trend = has(/trend|trending|what('s| is) hot|viral|popular|rising|growing/);
  const lead = has(/lead|prospect|customer|client|businesses|companies|buyers|who should i contact|potential customers/);
  const opportunity = has(/opportunit|demand|pain point|need|market gap|business idea|problem to solve|what can i sell|what should i sell/);
  const tender = has(/tender|contract|procurement|government bid|rfp|rfq|public bid/);
  const competitor = has(/competitor|competition|rival|monitor|market share/);
  const ecommerce = has(/ecommerce|e-commerce|product to sell|products to sell|shop|store|product idea|physical product/);
  const outreach = has(/outreach|email|contact|message|follow.?up|cold email/);
  const content = has(/content|post|blog|social media|campaign|caption|article/);
  const research = has(/research|investigate|analy[sz]e|analyze|deep dive|compare/);

  // Route compound requests to multiple agents instead of forcing everything into one agent.
  if (trend) add('trend-finder');
  if (tender) add('tender-finder');
  if (competitor) add('competitor-monitor');
  if (ecommerce) add('ecommerce-opportunity');
  if (opportunity || (trend && has(/business|money|market|make money|sell/))) add('opportunity-finder');
  if (lead) add('lead-finder');
  if (outreach) add('outreach');
  if (content) add('content');
  if (research && agents.length === 0) { add('trend-finder'); add('opportunity-finder'); }
  if (agents.length === 0) add('lead-finder');

  const explanation = agents.length > 1
    ? `I understood this as a ${agents.length}-agent job. I will use ${agents.join(', ')}, then return the evidence and results together.`
    : `I understood your request and routed it to ${agents[0]}. I will return the available evidence and results instead of inventing data.`;
  return { agents, query, explanation };
}

export async function runCommand(auth: Parameters<typeof runAgent>[0], command: string, options: Omit<AgentRunInput, 'agent' | 'query'> = {}) {
  const plan = planCommand(command);
  const outputs: Array<{ agent: string; result: unknown }> = [];
  for (const agent of plan.agents) {
    try {
      const result = await runAgent(auth, { agent, query: plan.query, ...options });
      outputs.push({ agent, result: result.body });
    } catch (error) {
      outputs.push({ agent, result: { error: error instanceof Error ? error.message : 'Agent failed' } });
    }
  }
  return { plan, outputs };
}
