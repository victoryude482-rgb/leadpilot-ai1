import type { AgentRunInput } from './runtime';

type Job = {
  id: string; title: string; company?: string; description: string; url: string;
  source: string; location?: string; compensation?: string; posted?: string;
  matchScore: number; label: 'GOOD'|'MEDIUM'|'BAD'; skills: string[];
  problem: string; solution: string; plan: string[]; proposal: string;
};

const SOURCES = [
  { name: 'Indeed', domain: 'indeed.com/jobs' },
  { name: 'Upwork', domain: 'upwork.com/freelance-jobs' },
  { name: 'Freelancer', domain: 'freelancer.com/projects' },
  { name: 'Fiverr', domain: 'fiverr.com/categories' },
] as const;

function escapeXml(s: string) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }
function stripHtml(s: string) { return s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim(); }
function extract(xml: string) {
  return [...xml.matchAll(/<item[\s\S]*?<\/item>/gi)].map(block => {
    const get=(tag:string)=>{const m=block[0].match(new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)<\\/${tag}>`,'i'));return m?.[1] ? stripHtml(m[1]).replace(/<!\[CDATA\[|\]\]>/g,'').trim() : '';};
    return { title:get('title'), description:get('description'), url:get('link'), pubDate:get('pubDate') };
  }).filter(x=>x.title && x.url);
}
function score(text:string, query:string) {
  const q=query.toLowerCase().split(/[^a-z0-9+#.]+/).filter(x=>x.length>2);
  const t=text.toLowerCase(); const hits=q.filter(x=>t.includes(x)).length;
  return Math.max(25, Math.min(98, 45 + hits*9 + (/remote|worldwide|flexible/i.test(t)?8:0) + (/budget|salary|hourly|fixed price/i.test(t)?7:0)));
}
function label(n:number):Job['label'] { return n>=75?'GOOD':n>=55?'MEDIUM':'BAD'; }
function skills(text:string) { return [...new Set((text.match(/\b(?:react|next\.js|typescript|javascript|python|node\.js|wordpress|shopify|figma|seo|marketing|sales|design|php|java|flutter|aws|sql|ai|automation|copywriting)\b/gi)||[]).map(x=>x.toLowerCase()))].slice(0,8); }
function solve(title:string, description:string) {
  const t=(title+' '+description).toLowerCase();
  const problem = /website|web|shopify|wordpress|landing/.test(t) ? 'The client needs a stronger or functioning web presence.' : /logo|brand|design|ui|ux/.test(t) ? 'The client needs a clearer visual identity or user experience.' : /bug|error|fix|broken|issue/.test(t) ? 'The client has a technical problem that needs diagnosis and a verified fix.' : /marketing|seo|sales|lead/.test(t) ? 'The client needs more qualified attention, traffic or customers.' : 'The client has a business task that needs a defined deliverable and execution plan.';
  const solution = /website|web|shopify|wordpress/.test(t) ? 'Audit the current experience, define the required pages, implement the highest-impact changes, test mobile/performance, and deliver the site.' : /logo|brand|design/.test(t) ? 'Create a small brand system, produce initial concepts, validate the chosen direction, and deliver reusable assets.' : /bug|error|fix|broken/.test(t) ? 'Reproduce the issue, isolate the root cause, implement the smallest safe fix, add a regression check, and verify the result.' : /marketing|seo|sales|lead/.test(t) ? 'Define the target audience, audit the current funnel, create measurable improvements, and report the resulting signals.' : 'Clarify requirements, split the work into milestones, build the smallest complete solution, test it, and hand over documentation.';
  const plan=['Clarify requirements and acceptance criteria','Audit the existing work and constraints','Build the first working version','Test against the client requirements','Deliver, document and request approval'];
  const proposal=`Hi — I reviewed your project and understand that you need ${problem.toLowerCase()} I can approach it by ${solution.toLowerCase()} I would start with a quick requirements/audit pass, then deliver the work in clear milestones with testing before handoff. I can share the first milestone plan before implementation.`;
  return { problem, solution, plan, proposal };
}
function searchUrl(source:string, query:string) {
  const q=encodeURIComponent(query);
  if(source==='Indeed') return `https://www.indeed.com/jobs?q=${q}`;
  if(source==='Upwork') return `https://www.upwork.com/nx/search/jobs/?q=${q}`;
  if(source==='Freelancer') return `https://www.freelancer.com/jobs/${q}/`;
  return `https://www.fiverr.com/search/gigs?query=${q}`;
}

export async function runWorkPilot(input: AgentRunInput) {
  const query=input.query.trim();
  const searches=SOURCES.map(s=>({source:s.name, url:`https://news.google.com/rss/search?q=${encodeURIComponent(`site:${s.domain} ${query}`)}&hl=en-US&gl=US&ceid=US:en`}));
  const settled=await Promise.allSettled(searches.map(x=>fetch(x.url,{headers:{'User-Agent':'LeadPilot WorkPilot/1.0'},next:{revalidate:300}})));
  const jobs:Job[]=[]; const warnings:string[]=[];
  for(let i=0;i<settled.length;i++){
    const r=settled[i]; const source=searches[i].source;
    if(r.status!=='fulfilled'||!r.value.ok){warnings.push(`${source}: public indexed discovery was unavailable; use the official search link.`);continue;}
    const items=extract(await r.value.text()).slice(0,12);
    for(const item of items){
      const text=`${item.title} ${item.description}`; const match=score(text,query); const solved=solve(item.title,item.description);
      jobs.push({id:`${source}-${Buffer.from(item.url).toString('base64url').slice(0,20)}`,title:item.title,description:item.description,url:item.url,source,posted:item.pubDate,location:input.location,matchScore:match,label:label(match),skills:skills(text),...solved});
    }
  }
  const unique=[...new Map(jobs.map(j=>[j.url,j])).values()].sort((a,b)=>b.matchScore-a.matchScore).slice(0,input.limit||20);
  if(!unique.length){
    warnings.push('No indexed listings were returned. The agent did not invent jobs; use the official source search links below.');
    for(const s of SOURCES){ unique.push({id:`search-${s.name}`,title:`Search ${s.name} for “${query}”`,description:`Official search entry point for ${query}.`,url:searchUrl(s.name,query),source:s.name,matchScore:0,label:'BAD',skills:[],...solve(query,`Search ${s.name} for ${query}`)}); }
  }
  return { agent:'workpilot', generatedAt:new Date().toISOString(), results:unique, warnings, strategy:['Uses public indexed discovery first; no private endpoints or fabricated listings.','Deduplicates by canonical URL and ranks by query relevance.','For every discovered opportunity, produces a problem statement, solution, work plan and draft proposal.','Official source search links are returned when indexed discovery is unavailable.'] };
}
