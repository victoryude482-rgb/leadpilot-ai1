import type { AgentName } from '../../docs/agent-contract';
import { runAgent, type AgentRunInput } from './runtime';

type CommandPlan = { agents: Exclude<AgentName, 'command-agent'>[]; query: string; explanation: string };

export function planCommand(command: string): CommandPlan {
  const query = command.trim();
  const text = query.toLowerCase();
  const agents: Exclude<AgentName, 'command-agent'>[] = [];
  const add = (agent: Exclude<AgentName, 'command-agent'>) => { if (!agents.includes(agent)) agents.push(agent); };
  if (/trend|trending|what('s| is) hot|viral|popular/.test(text)) add('trend-finder');
  if (/tender|contract|procurement|government bid|rfp|rfq/.test(text)) add('tender-finder');
  if (/competitor|competition|rival|monitor/.test(text)) add('competitor-monitor');
  if (/ecommerce|e-commerce|product to sell|products to sell|shop|store/.test(text)) add('ecommerce-opportunity');
  if (/opportunit|demand|pain point|need|market gap|business idea/.test(text)) add('opportunity-finder');
  if (/lead|prospect|customer|client|businesses|companies|buyers/.test(text)) add('lead-finder');
  if (/outreach|email|contact|message|follow.?up/.test(text)) add('outreach');
  if (/content|post|blog|social media|campaign idea/.test(text)) add('content');
  if (agents.length === 0) add('lead-finder');
  return { agents, query, explanation: agents.length > 1 ? `I split your request across ${agents.length} agents and will run them in sequence.` : `I routed your request to ${agents[0]}.` };
}

export async function runCommand(auth: Parameters<typeof runAgent>[0], command: string, options: Omit<AgentRunInput, 'agent' | 'query'> = {}) {
  const plan = planCommand(command);
  const outputs: Array<{ agent: string; result: unknown }> = [];
  for (const agent of plan.agents) {
    const result = await runAgent(auth, { agent, query: plan.query, ...options });
    outputs.push({ agent, result: result.body });
  }
  return { plan, outputs };
}
