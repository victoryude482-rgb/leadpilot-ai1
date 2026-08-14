import type { BusinessRecord } from '../leads/model';
import type { LeadScore, ScoreFactor } from '../leads/scoring';

export interface LeadResearch {
  summary: string;
  signals: string[];
  missing: string[];
  recommendedOffer: string;
  researchedAt: string;
}

export interface ResearchedLead {
  business: BusinessRecord;
  research: LeadResearch;
  score: LeadScore;
}

function textFromHtml(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 12000);
}

function inferSignals(business: BusinessRecord, text: string): string[] {
  const haystack = `${text} ${business.industry || ''}`.toLowerCase();
  const signals: string[] = [];
  if (business.website) signals.push('Has a public website');
  if (business.phone || business.email) signals.push('Has a direct contact channel');
  if (/book|appointment|schedule|reservation/.test(haystack)) signals.push('Accepts or promotes bookings');
  if (/online|ecommerce|shop|store|order/.test(haystack)) signals.push('Shows online sales activity');
  if (/facebook|instagram|linkedin|tiktok|social media/.test(haystack)) signals.push('Mentions social media activity');
  if (/contact|quote|request|consultation/.test(haystack)) signals.push('Has a conversion/contact call-to-action');
  return [...new Set(signals)].slice(0, 8);
}

function offerFor(business: BusinessRecord, signals: string[]): string {
  if (signals.some(s => /booking/i.test(s))) return 'AI booking and follow-up automation';
  if (signals.some(s => /online sales/i.test(s))) return 'AI sales and customer-support automation';
  if (!business.website) return 'AI-powered website and lead-capture automation';
  return 'AI lead generation and follow-up automation';
}

export async function researchLead(business: BusinessRecord, baseScore: LeadScore): Promise<ResearchedLead> {
  let text = '';
  if (business.website) {
    try {
      const response = await fetch(business.website, { signal: AbortSignal.timeout(4500), headers: { 'user-agent': 'VictoryAI-LeadResearch/1.0' } });
      if (response.ok) text = textFromHtml(await response.text());
    } catch { /* research is best-effort; discovery must still work */ }
  }
  const signals = inferSignals(business, text);
  const missing: string[] = [];
  if (!business.website) missing.push('website');
  if (!business.email && !business.phone) missing.push('direct contact');
  if (!business.industry) missing.push('industry classification');

  const extra: ScoreFactor[] = signals.map(signal => ({ factor: `research:${signal.toLowerCase().replace(/\s+/g, '_')}`, points: 3, explanation: `Observed from available business information${text ? ' and public website content' : ''}.` }));
  const score = Math.min(100, baseScore.score + Math.min(15, extra.length * 3));
  const label = score >= 90 ? 'HOT' : score >= 75 ? 'HIGH' : score >= 60 ? 'POTENTIAL' : 'LOW';
  const summary = `${business.name} appears to be a ${business.industry || 'business'}${business.city ? ` in ${business.city}` : ''}. ${signals.length ? `Detected signals: ${signals.join(', ')}.` : 'Limited public signals were available.'}`;
  return { business, score: { score, label, factors: [...baseScore.factors, ...extra] }, research: { summary, signals, missing, recommendedOffer: offerFor(business, signals), researchedAt: new Date().toISOString() } };
}
