import type { LeadProvider, LeadSearchQuery, DiscoveredBusiness } from './lead-provider';

export type ProviderHealth = { name: string; ok: boolean; records: number; error?: string };

/** Runs every configured provider independently. One failing source never blocks the others. */
export async function runMultiSourceProviders(providers: LeadProvider[], query: LeadSearchQuery): Promise<{ records: DiscoveredBusiness[]; health: ProviderHealth[] }> {
  const results = await Promise.allSettled(providers.map((provider) => provider.search(query)));
  const health: ProviderHealth[] = [];
  const records: DiscoveredBusiness[] = [];
  results.forEach((result, index) => {
    const name = providers[index]?.constructor?.name || `provider-${index + 1}`;
    if (result.status === 'fulfilled') {
      health.push({ name, ok: true, records: result.value.length });
      records.push(...result.value);
    } else {
      health.push({ name, ok: false, records: 0, error: result.reason instanceof Error ? result.reason.message : 'provider failed' });
    }
  });
  return { records, health };
}
