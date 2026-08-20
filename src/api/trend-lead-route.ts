import type { LeadProvider, LeadSearchQuery } from '../providers/lead-provider';
import { findLeadsFromTrends } from '../trends/trend-intelligence';
import type { AuthContext } from './lead-finder-handler';

export interface TrendLeadHttpRequest {
  method: string;
  body?: unknown;
}

/** POST-only adapter for the trend-first lead discovery flow.
 * Trend discovery can be used as public discovery; authenticated users still
 * receive their normal account-scoped results through the downstream layer.
 */
export async function postTrendLeadsSearch(
  request: TrendLeadHttpRequest,
  auth: AuthContext | null,
  providers: LeadProvider[],
) {
  if (request.method.toUpperCase() !== 'POST') return { status: 405, body: { error: 'Method not allowed' } };

  const body = typeof request.body === 'object' && request.body !== null
    ? request.body as Record<string, unknown>
    : {};
  const query: LeadSearchQuery = {
    industry: typeof body.industry === 'string' ? body.industry : undefined,
    country: typeof body.country === 'string' ? body.country : undefined,
    city: typeof body.city === 'string' ? body.city : (typeof body.location === 'string' ? body.location : undefined),
    keywords: typeof body.query === 'string' ? body.query : (typeof body.keywords === 'string' ? body.keywords : undefined),
    limit: typeof body.limit === 'number' ? body.limit : undefined,
  };

  try {
    // Use a stable public account namespace for anonymous discovery. When a
    // user is signed in, preserve the user's account id for downstream
    // persistence/scoring behavior.
    const accountId = auth?.accountId ?? 'public-search';
    const result = await findLeadsFromTrends(accountId, query, providers);
    return { status: 200, body: result };
  } catch (error) {
    return {
      status: 502,
      body: { error: error instanceof Error ? error.message : 'Trend lead discovery failed' },
    };
  }
}
