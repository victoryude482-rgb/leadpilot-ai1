import type { BusinessRecord } from './model';
import type { VerificationCheck } from './verification';

export interface ScoreFactor {
  factor: string;
  points: number;
  explanation: string;
}

export interface LeadScore {
  score: number;
  label: 'HOT' | 'HIGH' | 'POTENTIAL' | 'LOW';
  factors: ScoreFactor[];
}

export function scoreLead(
  business: BusinessRecord,
  checks: VerificationCheck[],
  targetIndustry?: string,
): LeadScore {
  const factors: ScoreFactor[] = [];
  const add = (factor: string, points: number, explanation: string) => factors.push({ factor, points, explanation });

  add('business_name', business.name.trim() ? 20 : 0, business.name.trim() ? 'Business name is present.' : 'Business name is missing.');
  add('website', business.website ? 10 : 0, business.website ? 'Website is supplied.' : 'No website supplied.');
  add('phone', business.phone ? 10 : 0, business.phone ? 'Phone is supplied.' : 'No phone supplied.');
  add('email', business.email ? 10 : 0, business.email ? 'Email is supplied.' : 'No email supplied.');

  const industryFit = targetIndustry && business.industry
    ? business.industry.toLowerCase().includes(targetIndustry.toLowerCase())
    : false;
  add('industry_fit', industryFit ? 15 : 0, industryFit ? 'Industry matches the target.' : 'No confirmed target-industry match.');

  const locationPresent = Boolean(business.city || business.country);
  add('business_activity_signal', locationPresent ? 10 : 0, locationPresent ? 'Business has location information.' : 'No activity/location signal available.');

  const contactCount = [business.website, business.phone, business.email].filter(Boolean).length;
  const valueSignal = business.industry ? Math.min(contactCount * 3 + 1, 10) : 0;
  add('potential_customer_value_signal', valueSignal, 'Heuristic based only on available business/contact information; not a prediction of revenue.');

  const automationSignal = contactCount >= 2 ? 15 : contactCount === 1 ? 8 : 0;
  add('automation_opportunity_signal', automationSignal, 'Contact surface suggests an opportunity for workflow automation; this is an inference.');

  const raw = factors.reduce((sum, factor) => sum + factor.points, 0);
  const score = Math.min(100, raw);
  const label = score >= 90 ? 'HOT' : score >= 75 ? 'HIGH' : score >= 60 ? 'POTENTIAL' : 'LOW';

  // Verification checks are evidence, not additional score points.
  void checks;
  return { score, label, factors };
}
