import { canRunCampaign, setCampaignStatus, type CampaignControl, type CampaignStatus } from './campaign-control';

export function controlCampaign(campaign: CampaignControl, status: CampaignStatus) {
  const next = setCampaignStatus(campaign, status);
  return { campaign: next, runnable: canRunCampaign(next) };
}
