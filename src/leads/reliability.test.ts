import { buildReliabilityReport } from './reliability';
import { buildReliableLeadReport } from './reliable-report';
import type { BusinessRecord } from './model';

const base: BusinessRecord = {
  id: 'business-1',
  name: 'Example Business',
  website: 'https://example.com',
  phone: '+2348000000000',
  email: 'hello@example.com',
  city: 'Lagos',
  country: 'Nigeria',
  industry: 'Technology',
  source: 'test',
};

describe('lead reliability', () => {
  it('requires a source and business name as evidence', () => {
    const report = buildReliabilityReport(base);
    expect(report.confidence).toBe(100);
    expect(report.level).toBe('HIGH');
  });

  it('does not treat missing contact data as verified', () => {
    const report = buildReliabilityReport({ ...base, phone: undefined, email: undefined });
    expect(report.checks.find((c) => c.name === 'Phone')?.status).toBe('MISSING');
    expect(report.checks.find((c) => c.name === 'Email')?.status).toBe('MISSING');
    expect(report.confidence).toBeLessThan(100);
  });

  it('returns a report with a website check', async () => {
    const report = await buildReliableLeadReport(base);
    expect(report.website.status).toBeDefined();
    expect(['PRIORITIZE', 'REVIEW', 'LOW_CONFIDENCE']).toContain(report.recommendation);
  });
});
