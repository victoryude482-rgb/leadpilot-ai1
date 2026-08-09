import type { BusinessRecord } from './model';

export type ReliabilityStatus = 'VERIFIED' | 'MISSING' | 'INVALID';

export interface ReliabilityCheck {
  name: 'Business name' | 'Source' | 'Website' | 'Phone' | 'Email';
  status: ReliabilityStatus;
  detail?: string;
}

export interface ReliabilityReport {
  confidence: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW';
  checks: ReliabilityCheck[];
}

export function buildReliabilityReport(business: BusinessRecord): ReliabilityReport {
  const checks: ReliabilityCheck[] = [
    {
      name: 'Business name',
      status: business.name.trim() ? 'VERIFIED' : 'MISSING',
    },
    {
      name: 'Source',
      status: business.source.trim() ? 'VERIFIED' : 'MISSING',
    },
    {
      name: 'Website',
      status: business.website?.trim() ? 'VERIFIED' : 'MISSING',
    },
    {
      name: 'Phone',
      status: business.phone?.trim() ? 'VERIFIED' : 'MISSING',
    },
    {
      name: 'Email',
      status: business.email?.trim() ? 'VERIFIED' : 'MISSING',
    },
  ];

  const verified = checks.filter((check) => check.status === 'VERIFIED').length;
  const confidence = Math.round((verified / checks.length) * 100);
  const level: ReliabilityReport['level'] =
    confidence >= 80 ? 'HIGH' : confidence >= 50 ? 'MEDIUM' : 'LOW';

  return { confidence, level, checks };
}
