import type { BusinessRecord, LeadStatus } from '../leads/model';
import { auditBusiness, type GbpAudit } from './gbp-audit';

export interface GbpFixInput {
  accountId: string;
  dealStatus: LeadStatus;
  business: BusinessRecord;
}

export interface GbpFixResult {
  delivered: boolean;
  reason: string;
  audit?: GbpAudit;
  plan?: string[];
  dealStatus: LeadStatus;
}

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

/** Explicit CRM/deal handoff. The fix plan is withheld until the lead is CUSTOMER. */
export async function deliverGbpFix(input: GbpFixInput): Promise<GbpFixResult> {
  if (input.dealStatus !== 'CUSTOMER') return { delivered: false, reason: 'withheld, deal not closed', dealStatus: input.dealStatus };
  const audit = await auditBusiness(input.business);
  return { delivered: true, reason: 'Deal is closed; GBP fix plan delivered for human/client execution.', audit, plan: planFromAudit(audit), dealStatus: input.dealStatus };
}
