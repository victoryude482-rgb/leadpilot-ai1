import type { FinderPipelineResult } from './lead-finder-pipeline';
import type { LeadStore } from '../leads/store';

export async function persistFinderResults(store: LeadStore, results: FinderPipelineResult[]): Promise<number> {
  let saved = 0;
  for (const result of results) {
    const business = {
      id: result.lead.businessId,
      name: result.lead.businessId,
      source: 'lead-finder',
    };
    // The pipeline result currently carries a compact lead projection. This adapter
    // intentionally persists only what is available until the provider/business ID
    // contract is expanded to carry the full business record.
    await store.saveBusiness(business);
    await store.saveLead(result.lead);
    saved += 1;
  }
  return saved;
}
