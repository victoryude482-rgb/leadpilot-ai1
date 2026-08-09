import type { LeadProvider, LeadSearchQuery, DiscoveredBusiness } from '../providers/lead-provider';
import { searchLeads } from '../providers/search-service';
import { buildReliableLeadReport } from '../leads/reliable-report';
import { scoreLead } from '../leads/scoring';
import { verifyBusiness } from '../leads/verification';
import type { BusinessRecord, LeadRecord } from '../leads/model';

export interface FinderPipelineResult {
  lead: LeadRecord;
  business: BusinessRecord;
  report: Awaited<ReturnType<typeof buildReliableLeadReport>>;
}

export async function runLeadFinderPipeline(
  accountId: string,
  providers: LeadProvider[],
  query: LeadSearchQuery,
): Promise<{ results: FinderPipelineResult[]; warnings: string[] }> {
  const found = await searchLeads(providers, query);
  const results: FinderPipelineResult[] = [];

  for (const discovered of found.records) {
    const business: BusinessRecord = {
      id: crypto.randomUUID(),
      name: discovered.name,
      website: discovered.website,
      phone: discovered.phone,
      email: discovered.email,
      address: discovered.address,
      city: discovered.city,
      country: discovered.country,
      industry: discovered.industry,
      source: discovered.source,
    };
    const verification = verifyBusiness(business);
    const scoring = scoreLead(business, verification, query.industry);
    const report = await buildReliableLeadReport(business);
    const now = new Date().toISOString();

    results.push({
      business,
      lead: {
        id: crypto.randomUUID(),
        accountId,
        businessId: business.id,
        status: 'NEW',
        score: scoring.score,
        scoreLabel: scoring.label,
        createdAt: now,
        updatedAt: now,
      },
      report,
    });
  }

  return { results, warnings: found.warnings };
}
