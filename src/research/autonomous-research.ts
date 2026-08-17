import { researchWeb, type ResearchResponse, type ResearchInsight } from './web-research';

export interface AutonomousResearchOptions {
  maxPasses?: number;
  minSources?: number;
  minConfidence?: number;
}

export interface AutonomousResearchResponse extends ResearchResponse {
  passes: number;
  stopReason: 'confidence_reached' | 'source_target_reached' | 'max_passes' | 'no_new_evidence';
}

function confidence(insights: ResearchInsight[]): number {
  if (!insights.length) return 0;
  return Math.round(insights.reduce((sum, item) => sum + item.confidence, 0) / insights.length);
}

function needsMoreResearch(result: ResearchResponse, minSources: number, minConfidence: number): boolean {
  const contradiction = result.insights.some((item) => item.type === 'contradiction' && item.confidence >= 55);
  const risk = result.insights.some((item) => item.type === 'risk' && item.confidence >= 75);
  return result.sources.length < minSources || confidence(result.insights) < minConfidence || contradiction || risk;
}

/**
 * Bounded autonomous research loop.
 * Each pass asks the existing Perplexity-style researcher for a fresh synthesis.
 * The loop stops when evidence is sufficient, when no new evidence appears, or
 * when the safety bound is reached. It never runs indefinitely.
 */
export async function researchUntilSatisfied(
  question: string,
  options: AutonomousResearchOptions = {},
): Promise<AutonomousResearchResponse> {
  const maxPasses = Math.min(Math.max(options.maxPasses ?? 3, 1), 4);
  const minSources = Math.min(Math.max(options.minSources ?? 12, 1), 40);
  const minConfidence = Math.min(Math.max(options.minConfidence ?? 72, 0), 100);

  let result = await researchWeb(question);
  let passes = 1;
  let previousUrls = new Set(result.sources.map((source) => source.url));

  while (passes < maxPasses && needsMoreResearch(result, minSources, minConfidence)) {
    const focus = result.followUpQueries.slice(0, 3).join(' OR ');
    if (!focus) break;

    const nextQuestion = `${question}. Focus the next investigation on these unresolved questions: ${focus}`;
    const next = await researchWeb(nextQuestion);
    passes += 1;

    const merged = new Map<string, ResearchResponse['sources'][number]>();
    for (const source of [...result.sources, ...next.sources]) {
      const existing = merged.get(source.url);
      if (!existing || (source.evidenceScore ?? 0) > (existing.evidenceScore ?? 0)) merged.set(source.url, source);
    }

    const newUrls = [...merged.keys()].filter((url) => !previousUrls.has(url));
    previousUrls = new Set(merged.keys());
    result = {
      ...next,
      sources: [...merged.values()].sort((a, b) => (b.evidenceScore ?? 0) - (a.evidenceScore ?? 0)).slice(0, 40),
      queries: [...new Set([...result.queries, ...next.queries])],
      warnings: [...new Set([...result.warnings, ...next.warnings])],
      insights: [...next.insights, ...result.insights].filter((item, index, all) => all.findIndex((x) => x.type === item.type && x.text === item.text) === index).slice(0, 12),
    };

    if (!newUrls.length) {
      return { ...result, passes, stopReason: 'no_new_evidence' };
    }
  }

  const averageConfidence = confidence(result.insights);
  const stopReason = result.sources.length >= minSources
    ? 'source_target_reached'
    : averageConfidence >= minConfidence
      ? 'confidence_reached'
      : 'max_passes';

  return { ...result, passes, stopReason };
}
