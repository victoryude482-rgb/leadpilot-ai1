export type LeadRecord = {
  id: string;
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country?: string;
  industry?: string;
  source: string;
  score?: number;
  updatedAt: string;
};

export interface LeadStore {
  upsertMany(records: LeadRecord[]): Promise<void>;
  findByQuery(query: { industry?: string; country?: string; city?: string; limit?: number }): Promise<LeadRecord[]>;
}

/**
 * Storage boundary: the application can use Supabase/Postgres, Redis, or another
 * database without changing the lead agents. This in-memory implementation is
 * deliberately dependency-free and acts as a safe fallback/cache for one process.
 */
export class MemoryLeadStore implements LeadStore {
  private readonly records = new Map<string, LeadRecord>();

  async upsertMany(records: LeadRecord[]) {
    for (const record of records) this.records.set(record.id, record);
  }

  async findByQuery(query: { industry?: string; country?: string; city?: string; limit?: number }) {
    const normalize = (value?: string) => value?.trim().toLowerCase();
    const industry = normalize(query.industry);
    const country = normalize(query.country);
    const city = normalize(query.city);
    return [...this.records.values()]
      .filter((record) => !industry || normalize(record.industry)?.includes(industry))
      .filter((record) => !country || normalize(record.country) === country)
      .filter((record) => !city || normalize(record.city) === city)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, query.limit ?? 50);
  }
}
