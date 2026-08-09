import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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
    assert.equal(report.confidence, 100);
    assert.equal(report.level, 'HIGH');
  });

  it('does not treat missing contact data as verified', () => {
    const report = buildReliabilityReport({ ...base, phone: undefined, email: undefined });
    assert.equal(report.checks.find((c) => c.name === 'Phone')?.status, 'MISSING');
    assert.equal(report.checks.find((c) => c.name === 'Email')?.status, 'MISSING');
    assert.ok(report.confidence < 100);
  });

  it('returns a report with a website check', async () => {
    const report = await buildReliableLeadReport(base);
    assert.ok(report.website.status);
    assert.ok(['PRIORITIZE', 'REVIEW', 'LOW_CONFIDENCE'].includes(report.recommendation));
  });
});
