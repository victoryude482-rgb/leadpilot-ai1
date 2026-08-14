export type LeadQuality = 'GOOD' | 'MEDIUM' | 'BAD';

export function classifyLeadScore(score: number | null | undefined): LeadQuality {
  const value = Number(score ?? 0);
  if (value >= 70) return 'GOOD';
  if (value >= 40) return 'MEDIUM';
  return 'BAD';
}

export function summarizeLeadQuality(scores: Array<number | null | undefined>) {
  return scores.reduce((summary, score) => {
    summary[classifyLeadScore(score)] += 1;
    return summary;
  }, { GOOD: 0, MEDIUM: 0, BAD: 0 });
}
