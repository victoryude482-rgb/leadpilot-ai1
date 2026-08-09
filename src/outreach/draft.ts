import type { BusinessRecord } from '../leads/model';

export function generateOutreachDraft(business: BusinessRecord): string {
  const location = business.city || business.country ? ` in ${[business.city, business.country].filter(Boolean).join(', ')}` : '';
  const industry = business.industry ? ` for ${business.industry} businesses` : '';

  return `Hi ${business.name} team,\n\nI’m reaching out because LeadPilot identified your business${location}${industry} as a potential fit for improving lead follow-up and sales workflows.\n\nIf improving response time or reducing manual follow-up is a priority, I’d be happy to show you what an automated workflow could look like.\n\nWould a short conversation be useful?`;
}
