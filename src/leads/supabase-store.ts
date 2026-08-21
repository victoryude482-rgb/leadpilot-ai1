import type { BusinessRecord, LeadRecord, LeadStatus } from './model';
import type { LeadStore } from './store';

export interface SupabaseStoreConfig { url: string; serviceRoleKey: string; }
type DbBusiness = { id:string; name:string; website?:string; phone?:string; email?:string; address?:string; city?:string; country?:string; industry?:string; source:string };
type DbLead = { id:string; account_id:string; business_id:string; status:LeadStatus; score:number; score_label:LeadRecord['scoreLabel']; created_at:string; updated_at:string };
function businessFromDb(row:DbBusiness):BusinessRecord{return {id:row.id,name:row.name,website:row.website,phone:row.phone,email:row.email,address:row.address,city:row.city,country:row.country,industry:row.industry,source:row.source};}
function leadFromDb(row:DbLead):LeadRecord{return {id:row.id,accountId:row.account_id,businessId:row.business_id,status:row.status,score:row.score,scoreLabel:row.score_label,createdAt:row.created_at,updatedAt:row.updated_at};}
export class SupabaseLeadStore implements LeadStore {
 constructor(private readonly config:SupabaseStoreConfig){}
 private async request(path:string,init:RequestInit={}){const response=await fetch(`${this.config.url.replace(/\/$/,'')}/rest/v1/${path}`,{...init,headers:{apikey:this.config.serviceRoleKey,Authorization:`Bearer ${this.config.serviceRoleKey}`,'Content-Type':'application/json',Prefer:'return=representation',...(init.headers??{})}});if(!response.ok)throw new Error(`Supabase request failed: ${response.status}`);return response;}
 async saveBusiness(business:BusinessRecord){const response=await this.request('businesses?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:business.id,name:business.name,website:business.website??null,phone:business.phone??null,email:business.email??null,address:business.address??null,city:business.city??null,country:business.country??null,industry:business.industry??null,source:business.source})});return businessFromDb((await response.json())[0] as DbBusiness);}
 async saveLead(lead:LeadRecord){const response=await this.request('leads?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({id:lead.id,account_id:lead.accountId,business_id:lead.businessId,status:lead.status,score:lead.score,score_label:lead.scoreLabel,created_at:lead.createdAt,updated_at:lead.updatedAt})});return leadFromDb((await response.json())[0] as DbLead);}
 async updateStatus(accountId:string,leadId:string,status:LeadStatus){await this.request(`leads?id=eq.${encodeURIComponent(leadId)}&account_id=eq.${encodeURIComponent(accountId)}`,{method:'PATCH',body:JSON.stringify({status,updated_at:new Date().toISOString()})});}
 async listLeads(accountId:string){const response=await this.request(`leads?account_id=eq.${encodeURIComponent(accountId)}&order=created_at.desc`);return (await response.json() as DbLead[]).map(leadFromDb);}
 async getBusiness(businessId:string){const response=await this.request(`businesses?id=eq.${encodeURIComponent(businessId)}&limit=1`);const row=(await response.json() as DbBusiness[])[0];return row?businessFromDb(row):null;}
}
