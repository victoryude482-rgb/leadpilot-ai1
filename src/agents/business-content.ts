import { runPythonAgent } from './python-worker';
import type { AgentRunInput } from './runtime';

export async function runBusinessContent(input: AgentRunInput) {
  const python = await runPythonAgent({ ...input, agent: 'content' });
  if (python) return python;

  const topic = input.query || input.industry || 'your business';
  return {
    agent: 'content',
    results: [{
      title: `Content plan for ${topic}`,
      items: [
        'Customer problem post',
        'Useful educational post',
        'Proof or case-study post',
        'Clear next-step post',
      ],
      fallback: true,
    }],
    warnings: ['Python content reasoning was unavailable; TypeScript returned a safe fallback plan.'],
    strategy: ['TypeScript remains the API/control layer.', 'Python owns content reasoning and generation when available.'],
  };
}
