import test from 'node:test';
import assert from 'node:assert/strict';
import { interpretLeadQuery } from './lead-query';

test('interprets a natural language local business request without searching instruction words', () => {
  const query = interpretLeadQuery({ keywords: 'Find real salons in Lagos, Nigeria that need websites' });
  assert.equal(query.city, 'Lagos');
  assert.equal(query.country, 'Nigeria');
  assert.equal(query.industry, 'Beauty & wellness');
  assert.doesNotMatch(query.keywords || '', /find|real|need websites/i);
});

test('preserves explicit filters over conversational inference', () => {
  const query = interpretLeadQuery({ keywords: 'Find restaurants in Lagos', city: 'Abuja', country: 'Nigeria', industry: 'Catering' });
  assert.equal(query.city, 'Abuja');
  assert.equal(query.country, 'Nigeria');
  assert.equal(query.industry, 'Catering');
});
