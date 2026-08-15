import type { LeadSearchQuery } from '../providers/lead-provider';

export interface TechnicalDecision {
  type: 'credentials' | 'integration' | 'external-account' | 'code-or-deploy' | 'policy';
  title: string;
  reason: string;
  examples: string[];
}

export interface RecoveryDecision {
  action: 'retry' | 'broaden' | 'change-source' | 'technical-decision' | 'accept';
  reason: string;
  query?: LeadSearchQuery;
  technicalDecision?: TechnicalDecision;
}

/**
 * Autonomy boundary for Victory AI:
 *
 * The agents own ordinary problem solving: query cleanup, retries, source
 * switching, broadening, deduplication/verification and choosing the next
 * safe search step.
 *
 * The human owns irreversible or account-level technical decisions: API keys,
 * connecting external accounts (for example Google Business Profile), code /
 * deployment changes, and product/policy choices. Agents must never invent
 * credentials, silently connect an account, or claim an external action was
 * completed when it was not.
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
      technicalDecision: {
        type: 'credentials',
        title: 'Connect or configure the required data source',
        reason: 'The agent can continue with other sources, but this source needs authorized credentials.',
        examples: ['Add the provider API key', 'Connect the provider account', 'Choose whether this provider is worth enabling'],
      },
    });
  }

  if (/google business profile|google business|gbp/.test(warningText)) {
    decisions.push({
      action: 'technical-decision',
      reason: 'Google Business Profile is an external account capability and requires an explicit connection/authorization.',
      technicalDecision: {
        type: 'external-account',
        title: 'Connect Google Business Profile',
        reason: 'Victory AI can plan and prepare GBP work, but the account owner must authorize the connection.',
        examples: ['Connect GBP', 'Choose the profile/location', 'Approve changes before publishing'],
      },
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
  return /api key|apikey|credential|authentication|unauthorized|401|google business profile|google business|gbp/.test(
    warnings.join(' ').toLowerCase(),
  );
}
