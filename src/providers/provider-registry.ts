import type { LeadProvider } from './lead-provider';

export type ProviderHealth = { name: string; ok: boolean; latencyMs: number; error?: string };

export class ProviderRegistry {
  constructor(private readonly providers: Array<{ name: string; provider: LeadProvider }>) {}

  async search(query: Parameters<LeadProvider['search']>[0]) {
    const started = Date.now();
    const settled = await Promise.allSettled(
      this.providers.map(async ({ name, provider }) => ({ name, rows: await provider.search(query) })),
    );

    const results: any[] = [];
    const health: ProviderHealth[] = [];
    settled.forEach((result, index) => {
      const name = this.providers[index].name;
      if (result.status === 'fulfilled') {
        results.push(...result.value.rows);
        health.push({ name, ok: true, latencyMs: Date.now() - started });
      } else {
        health.push({ name, ok: false, latencyMs: Date.now() - started, error: result.reason instanceof Error ? result.reason.message : String(result.reason) });
      }
    });

    return { results, health };
  }
}
