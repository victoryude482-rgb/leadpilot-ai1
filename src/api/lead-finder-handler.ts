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

  // Public discovery is allowed without an account. Authenticated searches
  // keep the user's id so workspace persistence can be added later.
  const accountId = auth?.accountId ?? 'public-search';

  const result = await runLeadFinderPipeline(accountId, providers, {
    industry: request.industry?.trim(),
    country: request.country?.trim(),
    city: request.city?.trim(),
    keywords: request.keywords?.trim(),
    limit: Math.min(Math.max(request.limit ?? 25, 1), 100),
  });

  if (result.results.length === 0 && result.warnings.length > 0) {
    return {
      status: 502 as const,
      body: {
        error: result.warnings.join(' · '),
        warnings: result.warnings,
      },
    };
  }

  return {
    status: 200 as const,
    body: {
      results: result.results,
      count: result.results.length,
      warnings: result.warnings,
    },
  };
}
