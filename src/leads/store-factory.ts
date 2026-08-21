import { SupabaseLeadStore } from './supabase-store';
import { MemoryLeadStore, type LeadStore } from './store';

let memoryStore: MemoryLeadStore | undefined;

export function configuredLeadStore(): LeadStore {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (url && serviceRoleKey) return new SupabaseLeadStore({ url, serviceRoleKey });
  memoryStore ??= new MemoryLeadStore();
  return memoryStore;
}
