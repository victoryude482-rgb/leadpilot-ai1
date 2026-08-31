import { runPythonAgent } from './python-worker';
import type { AgentRunInput } from './runtime';

export interface CompetitorMonitorResult {
  agent: 'competitor-monitor';
  target: { name: string; website?: string };
  fetched: { status: number; url: string; title?: string; contentLength: number } | null;
  changeSignal: { detected: boolean; reason: string };
  analysis: Record<string, unknown> | null;
  warnings: string[];
  controlPlane: { scheduled: boolean; sideEffects: false };
}

function stripHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function runCompetitorMonitor(input: AgentRunInput): Promise<{ status: number; body: CompetitorMonitorResult }> {
  const website = input.website?.trim();
  const targetName = input.query?.trim() || 'competitor';
  const warnings: string[] = [];
  let fetched: CompetitorMonitorResult['fetched'] = null;
  let pageText = '';

  if (website) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      try {
        const response = await fetch(website, { redirect: 'follow', signal: controller.signal, cache: 'no-store', headers: { 'User-Agent': 'LeadPilot Competitor Monitor/1.0' } });
        const html = await response.text();
        pageText = stripHtml(html).slice(0, 30000);
        fetched = { status: response.status, url: response.url, contentLength: html.length };
        if (!response.ok) warnings.push(`Competitor website returned HTTP ${response.status}.`);
      } finally { clearTimeout(timer); }
    } catch (error) {
      warnings.push(`Competitor website could not be fetched: ${error instanceof Error ? error.message : 'request failed'}`);
    }
  } else warnings.push('No competitor website was supplied; monitoring is limited to the provided query/context.');

  const python = await runPythonAgent(input, {
    monitor: { name: targetName, website, fetched, pageText },
    mode: 'competitor-monitor',
  });
  const analysis = python?.results?.[0] ?? null;
  return {
    status: 200,
    body: {
      agent: 'competitor-monitor', target: { name: targetName, website }, fetched,
      changeSignal: { detected: Boolean(analysis?.changeDetected), reason: typeof analysis?.reason === 'string' ? analysis.reason : 'Baseline captured for comparison; a future scheduled run can compare this snapshot.' },
      analysis, warnings: [...warnings, ...(python ? [] : ['Python analysis unavailable; TypeScript returned the monitoring snapshot without interpretation.'])],
      controlPlane: { scheduled: false, sideEffects: false },
    },
  };
}
