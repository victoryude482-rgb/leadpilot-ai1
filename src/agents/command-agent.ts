import { orchestrate, type OrchestrationRequest } from './orchestrator';

/**
 * Command Agent: turns a plain-language business request into an orchestrated
 * run of the right specialist agents and returns one synthesized answer.
 * TypeScript is the control plane; the optional Python reasoning service is a
 * reasoning upgrade, not a requirement.
 */
export async function runCommand(auth: { accountId: string } | null, command: string, options: Record<string, unknown> = {}) {
  const request: OrchestrationRequest = {
    request: command,
    approvalRequired: /\b(contract|payment|quote|refund|guarantee|send|publish|deploy|buy)\b/i.test(command),
  };
  return orchestrate(request, auth);
}
