import type { LeadSearchQuery } from '../providers/lead-provider';

export interface RecoveryDecision {
  action: 'retry' | 'broaden' | 'change-source' | 'technical-decision' | 'accept';
  reason: string;
  query?: LeadSearchQuery;
}

/**
 * Autonomous recovery policy. The agent is allowed to fix search/query/provider
 * problems itself. It only escalates when the missing capability is a technical
 * configuration decision such as an API key or an external account connection.
 */
export function planRecovery(
  query: LeadSearchQuery,
  warnings: string[],
  resultCount: number,
): RecoveryDecision[] {
  if (resultCount > 0) {
    return [{ action: 'accept', reason: 'Verified source-backed records were returned.' }];
  }

  const warningText = warnings.join(' ').toLowerCase();
  const decisions: RecoveryDecision[] = [];

  if (/api key|apikey|credential|authentication|unauthorized|401/.test(warningText)) {
    decisions.push({
      action: 'technical-decision',
      reason: 'A source requires credentials or an account connection. The agent cannot safely invent or request secrets.',
    });
  }

  if (/403|forbidden|rate limit|429|timed out|timeout|network|failed/.test(warningText)) {
    decisions.push({
      action: 'change-source',
      reason: 'A discovery source is unavailable, so the agent should continue with other configured sources rather than stop.',
    });
  }

  const cleaned = (query.keywords ?? '')
    .replace(/\b(find|show|give|tell me|look for|search for|what are|what is|please)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const broadened = [query.industry, cleaned, query.city, query.country]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (broadened && broadened !== query.keywords) {
    decisions.push({
      action: 'broaden',
      reason: 'The original natural-language request produced no records, so the agent can automatically broaden the search terms.',
      query: { ...query, keywords: broadened },
    });
  }

  if (decisions.length === 0) {
    decisions.push({
      action: 'retry',
      reason: 'No useful records were returned; retrying the source-backed search is safe before escalating.',
      query,
    });
  }

  return decisions;
}

export function technicalDecisionNeeded(warnings: string[]): boolean {
  return /api key|apikey|credential|authentication|unauthorized|401/.test(warnings.join(' ').toLowerCase());
}
