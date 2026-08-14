export type CampaignEventType = 'CAMPAIGN_STARTED' | 'CAMPAIGN_PAUSED' | 'CONTACTED' | 'FOLLOW_UP_SENT' | 'REPLIED' | 'QUALIFIED' | 'OFFER_SENT' | 'BOOKED' | 'WON' | 'OPTED_OUT';

export interface CampaignEvent {
  id: string;
  campaignId: string;
  leadId: string;
  type: CampaignEventType;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function appendCampaignEvent(events: CampaignEvent[], event: CampaignEvent): CampaignEvent[] {
  return [...events, event];
}
