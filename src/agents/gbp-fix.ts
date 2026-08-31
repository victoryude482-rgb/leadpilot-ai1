import type { BusinessRecord, LeadStatus } from '../leads/model';
import { auditBusiness, type GbpAudit } from './gbp-audit';
import { runPythonAgent } from './python-worker';

export interface GbpFixInput { accountId: string; dealStatus: LeadStatus; business: BusinessRecord; }
export interface GbpFixResult { delivered: boolean; reason: string; audit?: GbpAudit; plan?: string[]; dealStatus: LeadStatus; }

function planFromAudit(audit: GbpAudit): string[] {
  return audit.issues.map((issue) => {
    switch (issue.code) {
      case 'NO_WEBSITE': return 'Create or restore a clear business website and add its official URL to the listing data.';
      case 'DEAD_WEBSITE': return 'Repair the public website URL and confirm it responds successfully before updating listing links.';
      case 'NO_PHONE': return 'Add the client-approved primary business phone number and verify that it reaches the business.';
      case 'NO_ADDRESS': return 'Add the client-approved physical/service address and verify the formatting before publishing.';
      case 'NO_CATEGORY': return 'Choose the most accurate primary business category from the client-approved category options.';
    }
  });
}

/** TypeScript is the deal gate; Python creates the reasoning-heavy fix plan only after the deal is closed. */
export async function deliverGbpFix(input: GbpFixInput): Promise<GbpFixResult> {
  if (input.dealStatus !== 'CUSTOMER') return { delivered: false, reason: 'withheld, deal not closed', dealStatus: input.dealStatus };
  const audit = await auditBusiness(input.business);
  const python = await runPythonAgent(
    { agent: 'gbp-fix', query: input.business.name, location: input.business.city, industry: input.business.industry, country: input.business.country },
    { business: input.business, audit, issues: audit.issues },
  );
  const pythonPlan = python?.results?.[0]?.plan;
  const plan = Array.isArray(pythonPlan) ? pythonPlan.filter((item): item is string => typeof item === 'string') : planFromAudit(audit);
  return { delivered: true, reason: python ? 'Deal is closed; Python generated the GBP fix plan for human/client execution.' : 'Deal is closed; TypeScript fallback generated the GBP fix plan for human/client execution.', audit, plan, dealStatus: input.dealStatus };
}
