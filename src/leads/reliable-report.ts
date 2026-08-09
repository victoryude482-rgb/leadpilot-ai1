import type { BusinessRecord } from './model';
import { buildReliabilityReport } from './reliability';

export type LeadRecommendation = 'PRIORITIZE' | 'REVIEW' | 'LOW_CONFIDENCE';

export interface ReliableLeadReport {
  reliability: ReturnType<typeof buildReliabilityReport>;
  website: {
    status: 'PRESENT' | 'MISSING';
  };
  recommendation: LeadRecommendation;
}

export async function buildReliableLeadReport(business: BusinessRecord): Promise<ReliableLeadReport> {
  const reliability = buildReliabilityReport(business);
  const website = {
    status: business.website?.trim() ? ('PRESENT' as const) : ('MISSING' as const),
  };

  const recommendation: LeadRecommendation =
    reliability.confidence >= 80
      ? 'PRIORITIZE'
      : reliability.confidence >= 50
        ? 'REVIEW'
        : 'LOW_CONFIDENCE';

  return { reliability, website, recommendation };
}
