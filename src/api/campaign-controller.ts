import { planCampaignExecution } from '../agents/campaign-execution';
import type { CampaignLead } from '../agents/autonomous-campaign';

export interface CampaignRunInput { lead: CampaignLead; sentToday?: number; }
export interface CampaignRunResponse { ok: boolean; action: string; reason: string; executed: boolean; }

export function runCampaignDecision(input: CampaignRunInput): CampaignRunResponse {
  const result = planCampaignExecution(input.lead, input.sentToday ?? 0);
  return { ok: true, action: result.action, reason: result.reason, executed: result.executed };
}
