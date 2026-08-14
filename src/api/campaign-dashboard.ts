import { summarizeCampaign, type CampaignEvent } from '../agents/campaign-metrics';

export function getCampaignDashboard(events: CampaignEvent[]) {
  const summary = summarizeCampaign(events);
  return {
    ...summary,
    active: events.filter(e => e.type === 'CAMPAIGN_ACTIVE').length > events.filter(e => e.type === 'CAMPAIGN_STOPPED').length,
  };
}
