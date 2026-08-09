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

  if (providers.length === 0) {
    return {
      status: 503 as const,
      body: { error: 'No lead-data provider is configured on the server.' },
    };
  }

  const result = await runLeadFinderPipeline(auth.accountId, providers, {
    industry: request.industry?.trim(),
    country: request.country?.trim(),
    city: request.city?.trim(),
    keywords: request.keywords?.trim(),
    limit: Math.min(Math.max(request.limit ?? 25, 1), 100),
  });

  // Do not silently return an empty list when the only live provider failed.
  // Surface the provider error so the user can fix the API key/scope instead
  // of seeing a search that appears to do nothing.
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
