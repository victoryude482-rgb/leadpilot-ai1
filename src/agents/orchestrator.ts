import { runAgent, type AgentRunResult } from './runtime';

export type OrchestrationRequest = {
  request: string;
  mode?: 'lead' | 'work' | 'website' | 'client' | 'general';
  approvalRequired?: boolean;
};

export type OrchestrationResult = {
  plan: string[];
  results: AgentRunResult[];
  finalInstruction: string;
  needsHumanApproval: boolean;
};

const MAX_STEPS = 8;

function chooseAgents(input: string, mode?: OrchestrationRequest['mode']) {
  const text = `${mode ?? ''} ${input}`.toLowerCase();
  const agents: string[] = [];
  if (/job|upwork|indeed|freelancer|fiverr|gig|freelance/.test(text)) agents.push('workpilot');
  if (/lead|prospect|company|business|customer/.test(text)) agents.push('opportunity-scout');
  if (/website|web site|landing|site|logo|brand/.test(text)) agents.push('website-brand');
  if (/client|customer|whatsapp|telegram|message|reply|chat/.test(text)) agents.push('communication');
  if (!agents.length) agents.push('opportunity-scout');
  return [...new Set(agents)].slice(0, 4);
}

export async function orchestrate(request: OrchestrationRequest): Promise<OrchestrationResult> {
  const names = chooseAgents(request.request, request.mode);
  const results: AgentRunResult[] = [];
  const plan = [`Interpret request`, ...names.map((name) => `Run ${name}`), 'Cross-check evidence', 'Human-quality review'];

  for (const name of names.slice(0, MAX_STEPS)) {
    const result = await runAgent(name, request.request, { orchestrated: true, priorResults: results.map((r) => r.output).filter(Boolean) });
    results.push(result);
  }

  const joined = results.map((r) => r.output ?? '').join('\n');
  const needsHumanApproval = Boolean(request.approvalRequired) || /\b(contract|payment|quote|refund|guarantee|submit|send|publish|deploy)\b/i.test(request.request);
  return {
    plan,
    results,
    finalInstruction: `Produce one concise, evidence-based answer from the specialist results. Never invent missing facts. Mark uncertainty. Do not claim an external action happened unless the tool confirms it. Remove robotic wording and keep the result specific to the user.\n\nSPECIALIST RESULTS:\n${joined}`,
    needsHumanApproval,
  };
}
