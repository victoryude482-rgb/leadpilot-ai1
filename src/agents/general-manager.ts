import type { AgentRunInput, AgentRunResult } from './runtime';

const PYTHON_AGENT_URL = process.env.PYTHON_AGENT_URL?.replace(/\/$/, '');

const ROUTES: Record<string, string> = {
  lead: 'lead-finder',
  leadfinder: 'lead-finder',
  trend: 'trend-finder',
  trends: 'trend-finder',
  opportunity: 'opportunity-finder',
  opportunities: 'opportunity-finder',
  tender: 'tender-finder',
  tenders: 'tender-finder',
  ecommerce: 'ecommerce-opportunity',
  shop: 'ecommerce-opportunity',
  work: 'workpilot',
  content: 'content',
  website: 'website-brand',
  brand: 'website-brand',
  competitor: 'competitor-monitor',
  outreach: 'outreach',
  'gbp-audit': 'gbp-audit',
  'gbp-outreach': 'gbp-outreach',
  'gbp-fix': 'gbp-fix',
};

function chooseAgents(query: string): string[] {
  const q = query.toLowerCase();
  const chosen = new Set<string>();
  if (/competitor|competition|rival|competitors/.test(q)) chosen.add(ROUTES.competitor);
  if (/trend|trending|what's hot|what is hot/.test(q)) chosen.add(ROUTES.trend);
  if (/tender|procurement|bid|contract/.test(q)) chosen.add(ROUTES.tender);
  if (/e-?commerce|product|sell online|products? to sell/.test(q)) chosen.add(ROUTES.ecommerce);
  if (/website|brand|landing page|rebrand/.test(q)) chosen.add(ROUTES.website);
  if (/content|post|copy|blog|caption/.test(q)) chosen.add(ROUTES.content);
  if (/outreach|email|message prospects|contact prospects/.test(q)) chosen.add(ROUTES.outreach);
  if (/google business|gbp|google profile|maps profile/.test(q)) chosen.add(ROUTES['gbp-audit']);
  if (/workpilot|research and solve|solve this/.test(q)) chosen.add(ROUTES.work);
  if (/opportunit|market research|business idea/.test(q)) chosen.add(ROUTES.opportunity);
  if (/lead|business|company|restaurant|customer|prospect|find .* in /.test(q)) chosen.add(ROUTES.lead);
  return [...chosen].slice(0, 3);
}

export async function runGeneralManager(account: { accountId: string } | null, input: AgentRunInput): Promise<AgentRunResult> {
  const agents = chooseAgents(input.query);
  const selected = agents.length ? agents : ['lead-finder'];
  if (!PYTHON_AGENT_URL) return { status: 503, body: { error: 'General Manager is not configured: PYTHON_AGENT_URL is missing.' } };

  const response = await fetch(`${PYTHON_AGENT_URL}/v1/agents/general-manager`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      account_id: account?.accountId ?? null,
      query: input.query,
      location: input.location, city: input.city, country: input.country,
      industry: input.industry, limit: input.limit ?? 25,
      agents: selected,
    }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) return { status: response.status, body: data.error ? data : { error: 'General Manager failed.' } };
  return data as AgentRunResult;
}
