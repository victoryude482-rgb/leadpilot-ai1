import type { LeadProvider, LeadSearchQuery } from '../providers/lead-provider';
import { runLeadFinderPipeline } from '../pipeline/lead-finder-pipeline';

export interface AuthContext {
  accountId: string;
}

export interface LeadFinderRequest extends LeadSearchQuery {}

export async function handleLeadFinder(
  auth: AuthContext | null,
  request: LeadFinderRequest,
  providers: LeadProvider[],
) {
  if (!auth?.accountId) {
    return { status: 401 as const, body: { error: 'Authentication required' } };
  }

  const result = await runLeadFinderPipeline(auth.accountId, providers, {
    industry: request.industry?.trim(),
    country: request.country?.trim(),
    city: request.city?.trim(),
    keywords: request.keywords?.trim(),
    limit: Math.min(Math.max(request.limit ?? 25, 1), 100),
  });

  return {
    status: 200 as const,
    body: {
      results: result.results,
      count: result.results.length,
      warnings: result.warnings,
    },
  };
}
