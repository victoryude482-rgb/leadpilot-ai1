export type QualityIssue = { severity: 'low'|'medium'|'high'; field: string; message: string };
export type QualityReport = { approved: boolean; issues: QualityIssue[]; checks: string[]; rewrittenStrings: number };

const banned = [/\bcutting-edge\b/gi,/\bseamless\b/gi,/\bleverage\b/gi,/\brevolutionary\b/gi,/\bunlock your potential\b/gi,/\bgame-changing\b/gi];
const replacements: Array<[RegExp,string]> = [
  [/\butilize\b/gi,'use'],[/\bin order to\b/gi,'to'],[/\bleverage\b/gi,'use'],[/\bseamless\b/gi,'smooth'],[/\bcutting-edge\b/gi,'modern'],[/\bsolution\b/gi,'approach'],[/\bgame-changing\b/gi,'useful'],
];

export function humanizeDeep(value: unknown): { value: unknown; changed: number } {
  let changed = 0;
  const visit = (v: unknown): unknown => {
    if (typeof v === 'string') {
      let out = v;
      for (const [re, replacement] of replacements) out = out.replace(re, replacement);
      if (out !== v) changed += 1;
      return out;
    }
    if (Array.isArray(v)) return v.map(visit);
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as Record<string,unknown>).map(([k,x]) => [k,visit(x)]));
    return v;
  };
  return { value: visit(value), changed };
}

export function reviewOutput(value: unknown): QualityReport {
  const issues: QualityIssue[] = [];
  const text = JSON.stringify(value);
  if (banned.some(re => re.test(text))) issues.push({ severity:'medium', field:'tone', message:'Generic AI marketing language was detected and should be rewritten.' });
  if (/\b(verified|completed|sent|submitted|deployed|contacted)\b/i.test(text) && /not verified|not completed|not sent|not submitted|not deployed|not contacted/i.test(text)) {
    issues.push({ severity:'low', field:'claims', message:'Output contains both action/verification language and a limitation; the limitation must remain explicit.' });
  }
  if (/password|api[_ -]?key|secret|token/i.test(text)) issues.push({ severity:'high', field:'security', message:'Potential credential material must never be exposed or fabricated.' });
  return { approved: !issues.some(i=>i.severity==='high'), issues, checks:['evidence language','human tone','unsupported action claims','credential exposure'], rewrittenStrings:0 };
}

export function finalizeAgentResult<T>(result: T): T & { quality: QualityReport } {
  const transformed = humanizeDeep(result);
  const quality = reviewOutput(transformed.value);
  quality.rewrittenStrings = transformed.changed;
  return { ...(transformed.value as object), quality } as T & { quality: QualityReport };
}
