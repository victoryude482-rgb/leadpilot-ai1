import type { ImportedLeadRow } from '../leads/model';
import { ProviderRegistry, type LeadProvider, type LeadProviderResult, type LeadSearchQuery } from './lead-provider';

function normalize(value?: string): string {
  return value?.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') ?? '';
}

function dedupeKey(record: ImportedLeadRow): string {
  const website = normalize(record.website);
  if (website) return `website:${website}`;
  return [normalize(record.name), normalize(record.city), normalize(record.country)].join('|');
}

/** Runs the configured providers and removes duplicate businesses before downstream scoring. */
export async function searchLeads(
  providers: LeadProvider[],
  query: LeadSearchQuery,
): Promise<LeadProviderResult> {
  if (providers.length === 0) {
    return {
      source: 'none',
      records: [],
      warnings: ['No lead provider is configured. Set LEAD_PROVIDER_ENDPOINT to enable lead discovery.'],
    };
  }

  const registry = new ProviderRegistry(providers);
  const found = await registry.searchAll(query);
  const seen = new Set<string>();
  const records: ImportedLeadRow[] = [];

  for (const record of found.records) {
    const key = dedupeKey(record);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    records.push(record);
    if (query.limit && records.length >= query.limit) break;
  }

  return { ...found, records };
}
