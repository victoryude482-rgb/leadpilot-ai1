import type { AgentRunInput } from './runtime';

/**
 * Optional Python reasoning-worker bridge. TypeScript remains the control plane:
 * auth, CRM transitions, approvals, persistence and side effects stay here.
 * When PYTHON_AGENT_URL is absent or unavailable, callers must use their TS fallback.
 */
export type PythonAgentResponse = {
  results: Array<{ matchScore?: number; [key: string]: unknown }>;
  [key: string]: unknown;
};

export const PYTHON_REASONING_AGENTS = new Set<AgentRunInput['agent']>([
  'trend-finder', 'opportunity-finder', 'tender-finder', 'ecommerce-opportunity',
  'workpilot', 'content', 'competitor-monitor', 'outreach', 'website-brand',
  'gbp-audit', 'gbp-outreach', 'gbp-fix',
]);

export async function runPythonAgent(
  input: AgentRunInput,
  extra: Record<string, unknown> = {},
): Promise<PythonAgentResponse | null> {
  const base = process.env.PYTHON_AGENT_URL?.replace(/\/$/, '');
  if (!base) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.PYTHON_AGENT_TIMEOUT_MS || 15000));
  try {
    const response = await fetch(`${base}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, ...extra }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body = await response.json() as Record<string, unknown>;
    if (body.error || !Array.isArray(body.results)) return null;
    return body as PythonAgentResponse;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
