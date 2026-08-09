import type { AuthContext } from '../auth/access';
import type { LeadProvider, LeadSearchQuery } from '../providers/lead-provider';
import { runLeadFinderPipeline } from '../pipeline/lead-finder-pipeline';
import { persistFinderResults } from '../pipeline/persist-finder-results';
import type { LeadStore } from '../leads/store';

export interface FindLeadsResponse {
  results: Awaited<ReturnType<typeof runLeadFinderPipeline>>['results'];
  warnings: string[];
  saved: number;
}

export async function handleFindLeads(
  context: AuthContext | null,
  query: LeadSearchQuery,
  providers: LeadProvider[],
  store: LeadStore,
): Promise<FindLeadsResponse> {
  if (!context) throw new Error('Authentication required');
  const result = await runLeadFinderPipeline(context.accountId, providers, query);
  const saved = await persistFinderResults(store, context.accountId, result.results);
  return { ...result, saved };
}
