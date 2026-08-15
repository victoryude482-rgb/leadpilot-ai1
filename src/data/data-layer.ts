export type LeadRecord = Record<string, unknown> & { id?: string; name?: string; source?: string };

export interface LeadStore {
  name: string;
  enabled(): boolean;
  saveMany(records: LeadRecord[]): Promise<void>;
  find(query: string, limit: number): Promise<LeadRecord[]>;
}

class NoopStore implements LeadStore {
  constructor(public name: string) {}
  enabled(){ return false; }
  async saveMany(_records: LeadRecord[]){ return; }
  async find(_query: string, _limit: number){ return []; }
}

export class SupabaseLeadStore extends NoopStore {
  constructor(){ super('supabase'); }
  enabled(){ return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); }
}

export class RedisLeadStore extends NoopStore {
  constructor(){ super('redis'); }
  enabled(){ return Boolean(process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL); }
}

export function configuredStores(): LeadStore[] {
  return [new SupabaseLeadStore(), new RedisLeadStore()].filter(store => store.enabled());
}

export async function fanOutSave(records: LeadRecord[]) {
  await Promise.allSettled(configuredStores().map(store => store.saveMany(records)));
}

export async function fanOutFind(query: string, limit = 50) {
  const stores = configuredStores();
  const results = await Promise.allSettled(stores.map(store => store.find(query, limit)));
  return results.flatMap(result => result.status === 'fulfilled' ? result.value : []);
}
