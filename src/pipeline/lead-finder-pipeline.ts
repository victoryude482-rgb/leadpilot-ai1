import type { LeadProvider, LeadSearchQuery } from '../providers/lead-provider';
import { searchLeads } from '../providers/search-service';
import { buildReliableLeadReport } from '../leads/reliable-report';
import { scoreLead } from '../leads/scoring';
import { verifyBusiness } from '../leads/verification';
import type { BusinessRecord, LeadRecord } from '../leads/model';
import { researchLead } from '../agents/lead-research-agent';

export interface FinderPipelineResult {
  lead: LeadRecord;
  business: BusinessRecord;
  report: Awaited<ReturnType<typeof buildReliableLeadReport>>;
  research: Awaited<ReturnType<typeof researchLead>>['research'];
}

export async function runLeadFinderPipeline(accountId: string, providers: LeadProvider[], query: LeadSearchQuery): Promise<{ results: FinderPipelineResult[]; warnings: string[] }> {
  const found = await searchLeads(providers, query);
  const limit = Math.min(Math.max(query.limit ?? 25, 1), 100);
  const candidates = found.records.slice(0, limit);
  const results = await Promise.all(candidates.map(async (discovered) => {
    const business: BusinessRecord = { id: crypto.randomUUID(), name: discovered.name, website: discovered.website, phone: discovered.phone, email: discovered.email, address: discovered.address, city: discovered.city, country: discovered.country, industry: discovered.industry, source: discovered.source };
    const verification = verifyBusiness(business);
    const baseScore = scoreLead(business, verification, query.industry);
    const researched = await researchLead(business, baseScore);
    const report = await buildReliableLeadReport(business);
    const now = new Date().toISOString();
    return { business, lead: { id: crypto.randomUUID(), accountId, businessId: business.id, status: 'NEW' as const, score: researched.score.score, scoreLabel: researched.score.label, createdAt: now, updatedAt: now }, report, research: researched.research };
  }));
  results.sort((a, b) => b.lead.score - a.lead.score);
  return { results, warnings: found.warnings };
}
