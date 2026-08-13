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
  if (providers.length === 0) {
    return {
      status: 503 as const,
      body: { error: 'No lead-data provider is configured on the server.' },
    };
  }

  const accountId = auth?.accountId ?? 'public-search';

  const result = await runLeadFinderPipeline(accountId, providers, {
    industry: request.industry?.trim(),
    country: request.country?.trim(),
    city: request.city?.trim(),
    keywords: request.keywords?.trim(),
    limit: Math.min(Math.max(request.limit ?? 25, 1), 100),
  });

  // Provider failures are warnings, not a failed search. The multi-source
  // layer is specifically designed to survive one or more unavailable sources.
  return {
    status: 200 as const,
    body: {
      results: result.results,
      count: result.results.length,
      warnings: result.warnings,
    },
  };
}
