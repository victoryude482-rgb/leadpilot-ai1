export interface HealthCheck { name: string; ok: boolean; detail?: string; }

export function buildHealthSummary(checks: HealthCheck[]) {
  const failed = checks.filter(c => !c.ok);
  return { ok: failed.length === 0, failed: failed.map(c => c.name), checks };
}
