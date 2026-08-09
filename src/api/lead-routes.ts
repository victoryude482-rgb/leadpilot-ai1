import type { AuthContext } from '../auth/access';
import { LeadService } from './lead-service';
import type { LeadSearchQuery, LeadProvider } from '../providers/lead-provider';
import { runLeadFinderPipeline } from '../pipeline/lead-finder-pipeline';
import { persistFinderResults } from '../pipeline/persist-finder-results';
import type { LeadStore } from '../leads/store';

export interface LeadApiDependencies {
  service: LeadService;
  providers: LeadProvider[];
  store: LeadStore;
}

export async function listLeads(context: AuthContext | null, deps: LeadApiDependencies) {
  return deps.service.list(context);
}

export async function findLeads(context: AuthContext | null, query: LeadSearchQuery, deps: LeadApiDependencies) {
  if (!context) throw new Error('Authentication required');
  const result = await runLeadFinderPipeline(context.accountId, deps.providers, query);
  await persistFinderResults(deps.store, result.results);
  return result;
}
