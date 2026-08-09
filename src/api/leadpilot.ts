import { importRows } from '../leads/importer';
import { scoreLead } from '../leads/scoring';
import { verifyBusiness } from '../leads/verification';
import type { BusinessRecord } from '../leads/model';

export interface LeadPipelineResult {
  business: BusinessRecord;
  verification: ReturnType<typeof verifyBusiness>;
  scoring: ReturnType<typeof scoreLead>;
}

/** Pure orchestration layer. Persistence and HTTP adapters can call this without duplicating business logic. */
export function processImportedLead(
  accountId: string,
  input: Record<string, unknown>,
  source: string,
  targetIndustry?: string,
): LeadPipelineResult | null {
  const { records } = importRows([{ ...input, source }]);
  const row = records[0];
  if (!row) return null;

  const business: BusinessRecord = {
    id: crypto.randomUUID(),
    ...row,
    source,
  };

  void accountId;
  const verification = verifyBusiness(business);
  const scoring = scoreLead(business, verification, targetIndustry);
  return { business, verification, scoring };
}
