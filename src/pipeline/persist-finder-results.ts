import type { FinderPipelineResult } from './lead-finder-pipeline';
import type { LeadStore } from '../leads/store';

export async function persistFinderResults(store: LeadStore, accountId: string, results: FinderPipelineResult[]): Promise<number> {
  let saved = 0;
  for (const result of results) {
    if (result.lead.accountId !== accountId) throw new Error('Finder result belongs to a different account');
    await store.saveBusiness(accountId, result.business);
    await store.saveLead(result.lead);
    saved += 1;
  }
  return saved;
}
