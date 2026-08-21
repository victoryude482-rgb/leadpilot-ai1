/** @deprecated Legacy fan-out store abstraction. Canonical lead persistence is src/leads/store.ts + src/leads/supabase-store.ts. */
export type LeadRecord=Record<string,unknown>&{id?:string;name?:string;source?:string};
export interface LeadStore{name:string;enabled():boolean;saveMany(records:LeadRecord[]):Promise<void>;find(query:string,limit:number):Promise<LeadRecord[]>}
class NoopStore implements LeadStore{constructor(public name:string){}enabled(){return false}async saveMany(_records:LeadRecord[]){return}async find(_query:string,_limit:number){return []}}
export class SupabaseLeadStore extends NoopStore{constructor(){super('supabase')}}
export class RedisLeadStore extends NoopStore{constructor(){super('redis')}}
export function configuredStores():LeadStore[]{return []}
export async function fanOutSave(_records:LeadRecord[]){return}
export async function fanOutFind(_query:string,_limit=50){return [] as LeadRecord[]}
