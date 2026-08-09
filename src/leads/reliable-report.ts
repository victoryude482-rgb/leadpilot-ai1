import type { BusinessRecord } from './model';
import { buildReliabilityReport, type ReliabilityReport } from './reliability';
import { checkWebsite, type WebsiteCheck } from './website-check';

export interface ReliableLeadReport {
  reliability: ReliabilityReport;
  website: WebsiteCheck;
  recommendation: 'PRIORITIZE' | 'REVIEW' | 'LOW_CONFIDENCE';
  reasons: string[];
}

export async function buildReliableLeadReport(business: BusinessRecord): Promise<ReliableLeadReport> {
  const reliability = buildReliabilityReport(business);
  const website = await checkWebsite(business.website);
  const reasons = reliability.checks.filter((c) => c.status === 'PASS').map((c) => c.detail);

  if (website.status === 'REACHABLE') {
    reasons.push('Website responded successfully during the live check.');
  } else if (business.website) {
    reasons.push(website.detail);
  }

  const effectiveConfidence = website.status === 'REACHABLE'
    ? Math.min(100, reliability.confidence + 10)
    : website.status === 'UNREACHABLE' || website.status === 'INVALID'
      ? Math.max(0, reliability.confidence - 10)
      : reliability.confidence;

  const recommendation = effectiveConfidence >= 85
    ? 'PRIORITIZE'
    : effectiveConfidence >= 60
      ? 'REVIEW'
      : 'LOW_CONFIDENCE';

  return { reliability: { ...reliability, confidence: effectiveConfidence }, website, recommendation, reasons };
}
