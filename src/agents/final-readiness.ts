export interface ReadinessCheck { name: string; passed: boolean; detail: string; }

export function summarizeReadiness(checks: ReadinessCheck[]) {
  const passed = checks.filter(c => c.passed).length;
  return { passed, total: checks.length, ready: checks.length > 0 && passed === checks.length, checks };
}
