import type { LeadProvider, LeadSearchQuery } from '../providers/lead-provider';
import { searchLeads } from '../providers/search-service';
import { buildReliableLeadReport } from '../leads/reliable-report';
import { scoreLead } from '../leads/scoring';
import { verifyBusiness } from '../leads/verification';
import type { LeadRecord } from '../leads/model';

export interface FinderPipelineResult {
  lead: LeadRecord;
  report: Awaited<ReturnType<typeof buildReliableLeadReport>>;
}

export async function runLeadFinderPipeline(
  accountId: string,
  providers: LeadProvider[],
  query: LeadSearchQuery,
): Promise<{ results: FinderPipelineResult[]; warnings: string[] }> {
  const found = await searchLeads(providers, query);
  const results: FinderPipelineResult[] = [];

  for (const business of found.records) {
    const verification = verifyBusiness({ id: 'pipeline', ...business });
    const scoring = scoreLead({ id: 'pipeline', ...business }, verification, query.industry);
    const report = await buildReliableLeadReport({ id: 'pipeline', ...business });
    const now = new Date().toISOString();

    results.push({
      lead: {
        id: crypto.randomUUID(),
        accountId,
        businessId: business.name,
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
