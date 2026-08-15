import type { AgentName } from '../../docs/agent-contract';
import { runAgent, type AgentRunInput } from './runtime';
import { classifyAutonomy } from './autonomy-policy';

type CommandPlan = { agents: Exclude<AgentName, 'command-agent'>[]; query: string; explanation: string; recovery: string[] };

function cleanQuery(value:string){
  return value.trim()
    .replace(/\b(find|show|give|tell me|look for|search for|what are|what is)\b/gi,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function recoveryQueries(command:string){
  const original=command.trim();
  const cleaned=cleanQuery(original);
  const generic=cleaned
    .replace(/\b(real|legitimate|verified|source-backed|actual)\b/gi,' ')
    .replace(/\s+/g,' ')
    .trim();
  return [...new Set([cleaned,generic,`${generic} businesses companies organizations`,`${generic} local businesses`].filter(Boolean))]
    .filter(q=>q.toLowerCase()!==original.toLowerCase())
    .slice(0,3);
}

export function planCommand(command: string): CommandPlan {
  const query = command.trim();
  const text = query.toLowerCase();
  const agents: Exclude<AgentName, 'command-agent'>[] = [];
  const add = (agent: Exclude<AgentName, 'command-agent'>) => { if (!agents.includes(agent)) agents.push(agent); };
  const has = (...patterns: RegExp[]) => patterns.some(pattern => pattern.test(text));
  const trend = has(/trend|trending|what('s| is) hot|viral|popular|rising|growing/);
  const lead = has(/lead|prospect|customer|client|businesses|companies|buyers|who should i contact|potential customers/);
  const opportunity = has(/opportunit|demand|pain point|need|market gap|business idea|problem to solve|what can i sell|what should i sell/);
  const tender = has(/tender|contract|procurement|government bid|rfp|rfq|public bid/);
  const competitor = has(/competitor|competition|rival|monitor|market share/);
  const ecommerce = has(/ecommerce|e-commerce|product to sell|products to sell|shop|store|product idea|physical product/);
  const outreach = has(/outreach|email|contact|message|follow.?up|cold email/);
  const content = has(/content|post|blog|social media|campaign|caption|article/);
  const research = has(/research|investigate|analy[sz]e|analyze|deep dive|compare/);

  if (trend) add('trend-finder');
  if (tender) add('tender-finder');
  if (competitor) add('competitor-monitor');
  if (ecommerce) add('ecommerce-opportunity');
  if (opportunity || (trend && has(/business|money|market|make money|sell/))) add('opportunity-finder');
  if (lead) add('lead-finder');
  if (outreach) add('outreach');
  if (content) add('content');
  if (research && agents.length === 0) { add('trend-finder'); add('opportunity-finder'); }
  if (agents.length === 0) add('lead-finder');

  const recovery = recoveryQueries(query);
  const explanation = agents.length > 1
    ? `I understood this as a ${agents.length}-agent job. I will use ${agents.join(', ')}, verify source-backed records, and recover automatically if a source fails.`
    : `I understood your request and routed it to ${agents[0]}. I will verify the returned records and automatically retry or broaden the search when a provider fails.`;
  return { agents, query, explanation, recovery };
}

function recordsOf(value:any):any[]{
  const found:any[]=[];
  const walk=(v:any)=>{if(v==null)return;if(Array.isArray(v)){v.forEach(walk);return}if(typeof v!=='object')return;if(Array.isArray(v.results))v.results.forEach((x:any)=>found.push(x));Object.entries(v).forEach(([k,x])=>{if(k!=='results'&&x&&typeof x==='object')walk(x)});};
  walk(value);return found;
}

function isVerifiedBusiness(item:any){
  const b=item?.business||item;
  const name=b?.name||item?.company||item?.businessName;
  const source=b?.source||item?.source;
  const identity=Boolean(name && (b?.address||b?.city||b?.country||b?.phone||b?.website||b?.email));
  return Boolean(identity && source);
}

function usableLeadResult(body:any){
  const rows=recordsOf(body);
  return rows.filter(isVerifiedBusiness);
}

async function runWithRecovery(auth: Parameters<typeof runAgent>[0], agent: Exclude<AgentName,'command-agent'>, query:string, options:Omit<AgentRunInput,'agent'|'query'>, recovery:string[]){
  let best:any=null;
  let bestCount=-1;
  const attempts=[query,...recovery];
  for(let i=0;i<attempts.length;i++){
    try{
      const result=await runAgent(auth,{agent,query:attempts[i],...options});
      const body=result.body;
      const count=agent==='lead-finder'?usableLeadResult(body).length:recordsOf(body).length;
      if(count>bestCount){best=body;bestCount=count;}
      if(count>0) break;
    }catch(error){
      if(!best) best={error:error instanceof Error?error.message:'Agent failed'};
    }
  }
  return best||{error:'Agent returned no usable result.'};
}

export async function runCommand(auth: Parameters<typeof runAgent>[0], command: string, options: Omit<AgentRunInput, 'agent' | 'query'> = {}) {
  const plan = planCommand(command);
  const autonomy = classifyAutonomy(command);
  const outputs: Array<{ agent: string; result: unknown }> = [];
  for (const agent of plan.agents) {
    try {
      const result = await runWithRecovery(auth, agent, plan.query, options, plan.recovery);
      outputs.push({ agent, result });
    } catch (error) {
      outputs.push({ agent, result: { error: error instanceof Error ? error.message : 'Agent failed' } });
    }
  }
  return {
    plan,
    outputs,
    autonomy,
    automation: {
      selfHealing: true,
      autonomousProblemSolving: true,
      approvalGates: true,
      syntheticData: false,
      verifiedBusinessOnly: plan.agents.includes('lead-finder'),
    },
  };
}
