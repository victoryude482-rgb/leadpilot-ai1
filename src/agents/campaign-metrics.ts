export interface CampaignEvent { type: string; leadId: string; at: string; }

export function summarizeCampaign(events: CampaignEvent[]) {
  const counts: Record<string, number> = {};
  for (const event of events) counts[event.type] = (counts[event.type] ?? 0) + 1;
  const contacted = counts.CONTACTED ?? 0;
  const replied = counts.REPLIED ?? 0;
  const qualified = counts.QUALIFIED ?? 0;
  const won = counts.WON ?? 0;
  return {
    counts,
    replyRate: contacted ? replied / contacted : 0,
    qualificationRate: replied ? qualified / replied : 0,
    winRate: qualified ? won / qualified : 0,
  };
}
