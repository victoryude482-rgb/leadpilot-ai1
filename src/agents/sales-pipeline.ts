import { qualifyLead, type QualificationInput, type QualificationResult } from './qualification';
import { createOutreachDraft, type OutreachDraft } from './outreach';

export type SalesPipelineInput = QualificationInput & { name?: string; painPoint?: string; offer: string };
export type SalesPipelineResult = QualificationResult & { outreach: OutreachDraft };

export function buildSalesPipeline(lead: SalesPipelineInput): SalesPipelineResult {
  const qualification = qualifyLead(lead);
  const outreach = createOutreachDraft({ ...lead, company: lead.company }, lead.offer);
  return { ...qualification, outreach };
}
