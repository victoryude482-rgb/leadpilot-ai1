export type CachedLeadRecord = {
  id: string;
  name: string;
  source: string;
  sourceId?: string;
  country?: string;
  city?: string;
  category?: string;
  website?: string;
  phone?: string;
  email?: string;
  score?: number;
  updatedAt: string;
  raw?: Record<string, unknown>;
};

/**
 * Provider-agnostic storage contract. Supabase remains the source of truth
 * for authentication/workspaces; this interface lets us add Redis, Postgres,
 * or another datastore later without changing the lead agents.
 */
export interface LeadStore {
  get(key: string): Promise<CachedLeadRecord[] | null>;
  set(key: string, records: CachedLeadRecord[], ttlSeconds?: number): Promise<void>;
}

const memory = new Map<string, { expiresAt: number; records: CachedLeadRecord[] }>();

export class MemoryLeadStore implements LeadStore {
  async get(key: string) {
    const item = memory.get(key);
    if (!item || item.expiresAt <= Date.now()) {
      memory.delete(key);
      return null;
    }
    return item.records;
  }

  async set(key: string, records: CachedLeadRecord[], ttlSeconds = 300) {
    memory.set(key, { expiresAt: Date.now() + ttlSeconds * 1000, records });
  }
}

export function normalizeLeadCacheKey(query: string) {
  return query.toLowerCase().trim().replace(/\\s+/g, ' ');
}
