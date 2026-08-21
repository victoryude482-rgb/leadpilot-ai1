import type { LeadRecord, BusinessRecord, LeadStatus } from '../leads/model';
import { canTransition, transitionLead } from './crm-pipeline';

export type CampaignAction = 'RESEARCH'|'CONTACT'|'FOLLOW_UP'|'QUALIFY'|'OFFER'|'BOOKING'|'STOP';
export interface CampaignEvent { leadId:string; action:CampaignAction; reason:string; scheduledAt:string; }
export interface CampaignPolicy { maxAttempts:number; followUpDelayHours:number; minOfferScore:number; }
const DEFAULT_POLICY:CampaignPolicy={maxAttempts:3,followUpDelayHours:48,minOfferScore:75};
export interface CampaignLeadInput { id:string; status:LeadStatus; score:number; email?:string; phone?:string; optedOut?:boolean; lastContactedAt?:string; followUpsSent?:number; }
export interface CampaignDecision { action:CampaignAction; reason:string; priority:number; }
const DAY=86_400_000;

/** Canonical campaign decision engine. It only decides; status mutations go through crm-pipeline. */
export function decideNextAction(lead:CampaignLeadInput,now=new Date(),policy:Partial<CampaignPolicy>={}):CampaignDecision{
 const p={...DEFAULT_POLICY,...policy};
 if(lead.optedOut||['CUSTOMER','NOT_INTERESTED'].includes(lead.status))return{action:'STOP',reason:'Lead is closed or opted out.',priority:0};
 if(!lead.email&&!lead.phone)return{action:'RESEARCH',reason:'No contact channel is available.',priority:100};
 if(lead.status==='INTERESTED')return lead.score>=p.minOfferScore?{action:'OFFER',reason:`Lead score ${lead.score} meets the offer threshold.`,priority:95}:{action:'FOLLOW_UP',reason:`Nurture lead below the ${p.minOfferScore} offer threshold.`,priority:75};
 if(lead.status==='MEETING')return{action:'BOOKING',reason:'Lead is ready for scheduling.',priority:90};
 if(lead.status==='REPLIED')return{action:'QUALIFY',reason:'Lead replied and needs qualification.',priority:85};
 if(!lead.lastContactedAt)return{action:lead.status==='NEW'?'RESEARCH':'CONTACT',reason:lead.status==='NEW'?'Research before outreach.':'Send personalized first contact.',priority:Math.max(60,lead.score)};
 const followUps=lead.followUpsSent??0;const elapsed=now.getTime()-new Date(lead.lastContactedAt).getTime();
 if(followUps<p.maxAttempts&&elapsed>=3*DAY)return{action:'FOLLOW_UP',reason:'Follow-up window is due.',priority:Math.max(50,lead.score)};
 return{action:'STOP',reason:'No campaign action is currently due.',priority:0};
}
export function planCampaign(leads:Array<{lead:LeadRecord;business:BusinessRecord}>,policy:Partial<CampaignPolicy>={}):CampaignEvent[]{const now=new Date();return leads.flatMap(({lead,business})=>{const d=decideNextAction({id:lead.id,status:lead.status,score:lead.score},now,policy);if(d.action==='STOP')return [];return [{leadId:lead.id,action:d.action,reason:d.action==='CONTACT'?`Send personalized first contact to ${business.name}.`:d.reason,scheduledAt:now.toISOString()}];});}
export function transitionCampaignLead(lead:LeadRecord,to:LeadStatus,at=new Date().toISOString()):LeadRecord{if(!canTransition(lead.status,to))throw new Error(`Campaign attempted invalid status transition: ${lead.status} -> ${to}`);return transitionLead(lead,to,at);}
