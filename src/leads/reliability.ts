import type { BusinessRecord } from './model';

export type ReliabilityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ReliabilityReport {
  level: ReliabilityLevel;
  confidence: number;
  checks: Array<{ name: string; status: 'PASS' | 'MISSING'; detail: string }>;
}

export function buildReliabilityReport(business: BusinessRecord): ReliabilityReport {
  const checks = [
    { name: 'Business name', present: Boolean(business.name.trim()), detail: 'A business name is available.' },
    { name: 'Source', present: Boolean(business.source), detail: 'The discovery/import source is recorded.' },
    { name: 'Website', present: Boolean(business.website), detail: 'A website URL is supplied; reachability requires a live server-side check.' },
    { name: 'Phone', present: Boolean(business.phone), detail: 'A phone number is supplied; ownership is not inferred.' },
    { name: 'Email', present: Boolean(business.email), detail: 'An email is supplied; mailbox validity is not inferred.' },
    { name: 'Location', present: Boolean(business.city || business.country), detail: 'Location information is supplied.' },
  ];

  const passed = checks.filter((check) => check.present).length;
  const confidence = Math.round((passed / checks.length) * 100);
  const level: ReliabilityLevel = confidence >= 85 ? 'HIGH' : confidence >= 60 ? 'MEDIUM' : 'LOW';

  return {
    level,
    confidence,
    checks: checks.map(({ name, present, detail }) => ({ name, status: present ? 'PASS' : 'MISSING', detail })),
  };
}
