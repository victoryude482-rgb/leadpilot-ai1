export type CampaignStatus = 'ACTIVE' | 'PAUSED';

export interface CampaignControl {
  id: string;
  status: CampaignStatus;
  maxDailyContacts: number;
  followUpsEnabled: boolean;
}

export function canRunCampaign(campaign: CampaignControl): boolean {
  return campaign.status === 'ACTIVE' && campaign.maxDailyContacts > 0;
}

export function setCampaignStatus(campaign: CampaignControl, status: CampaignStatus): CampaignControl {
  return { ...campaign, status };
}
