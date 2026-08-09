export function scoreLead(lead) {
  const checks = {
    businessExists: Boolean(lead.businessExists),
    website: Boolean(lead.website),
    phone: Boolean(lead.phone),
    email: Boolean(lead.email),
    activePresence: Boolean(lead.activePresence),
    industryFit: Boolean(lead.industryFit),
    highValueService: Boolean(lead.highValueService),
    automationOpportunity: Boolean(lead.automationOpportunity),
    dataQuality: Boolean(lead.dataQuality),
  };

  const weights = {
    businessExists: 20,
    website: 10,
    phone: 10,
    email: 10,
    activePresence: 5,
    industryFit: 10,
    highValueService: 10,
    automationOpportunity: 15,
    dataQuality: 10,
  };

  const breakdown = Object.fromEntries(
    Object.entries(checks).map(([key, passed]) => [key, passed ? weights[key] : 0]),
  );

  const score = Object.values(breakdown).reduce((total, value) => total + value, 0);
  return { score, breakdown, checks };
}

export function classifyLead(score) {
  if (score >= 95) return 'HOT';
  if (score >= 80) return 'HIGH';
  if (score >= 50) return 'POTENTIAL';
  return 'LOW';
}
