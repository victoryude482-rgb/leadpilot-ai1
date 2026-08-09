import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyLead, scoreLead } from '../src/scoring.js';

test('scores a strong lead transparently', () => {
  const result = scoreLead({
    businessExists: true,
    website: true,
    phone: true,
    email: true,
    activePresence: true,
    industryFit: true,
    highValueService: true,
    automationOpportunity: true,
    dataQuality: true,
  });

  assert.equal(result.score, 100);
  assert.equal(classifyLead(result.score), 'HOT');
  assert.equal(result.breakdown.businessExists, 20);
});

test('does not treat an unverified business as verified', () => {
  const result = scoreLead({
    businessExists: false,
    website: true,
    phone: false,
    email: false,
    activePresence: true,
    industryFit: true,
    highValueService: true,
    automationOpportunity: true,
    dataQuality: false,
  });

  assert.equal(result.checks.businessExists, false);
  assert.equal(result.breakdown.businessExists, 0);
  assert.equal(classifyLead(result.score), 'POTENTIAL');
});
