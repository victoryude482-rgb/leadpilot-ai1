export type QualificationInput = { company?: string; website?: string; email?: string; industry?: string; location?: string; evidence?: string; }; 
export type QualificationResult = { score: number; tier: 'hot'|'warm'|'cold'; reasons: string[] };
export function qualifyLead(lead: QualificationInput): QualificationResult {
  let score = 0; const reasons: string[] = [];
  if (lead.email) { score += 25; reasons.push('A contact email is available.'); }
  if (lead.website) { score += 20; reasons.push('A business website is available for verification.'); }
  if (lead.industry) { score += 15; reasons.push('Industry information is available.'); }
  if (lead.location) { score += 10; reasons.push('Location information is available.'); }
  if (lead.evidence) { score += 30; reasons.push('A source-backed business signal/evidence was found.'); }
  score = Math.min(score, 100);
  return { score, tier: score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold', reasons };
}
