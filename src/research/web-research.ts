export type ResearchSource = {
  title: string;
  url: string;
  source: string;
  snippet?: string;
  publishedAt?: string;
  evidenceScore?: number;
  evidenceType?: 'news' | 'community' | 'web';
};

export type ResearchInsight = {
  type: 'theme' | 'opportunity' | 'risk' | 'contradiction';
  text: string;
  confidence: number;
};

export type ResearchResponse = {
  answer: string;
  sources: ResearchSource[];
  queries: string[];
  warnings: string[];
  insights: ResearchInsight[];
  followUpQueries: string[];
};

type SearchHit = ResearchSource;

const STOP = new Set(['what','where','when','which','about','find','show','give','tell','me','the','for','and','with','from','that','this','business','businesses','company','companies','best','good','real','actual','near','research','latest','look']);
const OPPORTUNITY = new Set(['automation','demand','growth','problem','problems','need','needs','pain','expensive','slow','manual','shortage','opportunity','adoption','customers','customer','sales','revenue','booking','orders','marketing']);
const RISK = new Set(['risk','risks','decline','fall','fraud','scam','complaint','complaints','negative','warning','shortage','regulation','regulations','cost','costs','competition']);

function tokens(text: string) {
  return [...new Set(text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(x => x.length > 2 && !STOP.has(x)))];
}
function cleanHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
}
function classify(source: string): ResearchSource['evidenceType'] {
  if (/reddit/i.test(source)) return 'community';
  if (/news/i.test(source)) return 'news';
  return 'web';
}

async function duck(query: string): Promise<SearchHit[]> {
  const url = new URL('https://html.duckduckgo.com/html/'); url.searchParams.set('q', query);
  const res = await fetch(url, { headers: { accept: 'text/html', 'user-agent': 'LeadPilotAI/1.0 research' }, signal: AbortSignal.timeout(6500) });
  if (!res.ok) throw new Error(`DuckDuckGo ${res.status}`);
  const html = await res.text(); const out: SearchHit[] = [];
  const re = /<div class="result"[\s\S]*?<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?(?:<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>|<div class="result__snippet"[^>]*>([\s\S]*?)<\/div>)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && out.length < 8) {
    let href = m[1]; try { const u = new URL(href, 'https://html.duckduckgo.com'); href = u.searchParams.get('uddg') ? decodeURIComponent(u.searchParams.get('uddg')!) : u.toString(); } catch { continue; }
    const title = cleanHtml(m[2]); const snippet = cleanHtml(m[3] || m[4] || '');
    if (title && /^https?:/i.test(href)) out.push({ title, url: href, source: 'DuckDuckGo', snippet, evidenceType:'web' });
  }
  return out;
}

async function news(query: string): Promise<SearchHit[]> {
  const url = new URL('https://news.google.com/rss/search'); url.searchParams.set('q', query); url.searchParams.set('hl','en-US'); url.searchParams.set('gl','US'); url.searchParams.set('ceid','US:en');
  const res = await fetch(url, { headers: { accept: 'application/rss+xml' }, signal: AbortSignal.timeout(5000) }); if (!res.ok) throw new Error(`Google News ${res.status}`);
  const xml = await res.text(); const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  const get = (s:string,n:string) => s.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${n}>`,'i'))?.[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim() || '';
  return items.slice(0,8).map(i => ({ title:get(i,'title'), url:get(i,'link'), source:`Google News · ${get(i,'source') || 'News'}`, snippet:cleanHtml(get(i,'description')), publishedAt:get(i,'pubDate'), evidenceType:'news' as const })).filter(x => x.title && x.url);
}

async function reddit(query: string): Promise<SearchHit[]> {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=8`;
  const res = await fetch(url, { headers: { 'user-agent': 'LeadPilotAI/1.0 research' }, signal: AbortSignal.timeout(5000) }); if (!res.ok) throw new Error(`Reddit ${res.status}`);
  const data = await res.json() as any; const children = data?.data?.children; if (!Array.isArray(children)) return [];
  return children.map((c:any) => { const p=c?.data; return p?.title ? { title:p.title, url:p.permalink ? `https://www.reddit.com${p.permalink}` : '', source:`Reddit · r/${p.subreddit || 'unknown'}`, snippet:typeof p.selftext==='string'?p.selftext.slice(0,500):'', evidenceType:'community' as const } : null; }).filter((x:any):x is SearchHit => Boolean(x?.title && x.url));
}

function plan(question: string): string[] {
  const w=tokens(question); const core=w.slice(0,12).join(' ');
  return [...new Set([
    question.trim(),
    `${core} latest trends market size growth`,
    `${core} businesses companies directory locations`,
    `${core} customer problems pain points demand`,
    `${core} automation software solutions opportunities`,
    `${core} reviews discussions Reddit complaints`,
  ])].slice(0,6);
}

function scoreSource(source: SearchHit, queryTokens: string[]): number {
  const text=tokens(`${source.title} ${source.snippet || ''}`);
  const overlap=queryTokens.filter(t=>text.includes(t)).length;
  const freshness=source.publishedAt ? Math.min(10, Math.max(0, 10 - Math.floor((Date.now()-Date.parse(source.publishedAt))/86400000/30))) : 4;
  const typeBonus=source.evidenceType==='news' ? 8 : source.evidenceType==='community' ? 7 : 5;
  const opportunityBonus=text.some(t=>OPPORTUNITY.has(t)) ? 7 : 0;
  return Math.min(100, 30 + overlap*7 + freshness + typeBonus + opportunityBonus);
}

function synthesize(question: string, hits: SearchHit[]): {answer:string; insights:ResearchInsight[]; followUpQueries:string[]} {
  if (!hits.length) return { answer:`I couldn't find enough public evidence to answer "${question}" reliably.`, insights:[], followUpQueries:[`${question} official data`, `${question} market report`] };
  const q=tokens(question);
  const unique=[...new Map(hits.map(h=>[h.url,h])).values()].map(h=>({...h,evidenceScore:scoreSource(h,q)})).sort((a,b)=>(b.evidenceScore||0)-(a.evidenceScore||0));
  const counts=new Map<string,number>();
  for(const h of unique) for(const t of tokens(`${h.title} ${h.snippet||''}`)) counts.set(t,(counts.get(t)||0)+1);
  const themes=[...counts.entries()].filter(([,n])=>n>=2).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const opportunities=themes.filter(([t])=>OPPORTUNITY.has(t)).slice(0,4);
  const risks=themes.filter(([t])=>RISK.has(t)).slice(0,4);
  const sourceTypes=new Set(unique.map(h=>h.evidenceType));
  const insights:ResearchInsight[]=[];
  if(themes.length) insights.push({type:'theme',text:`Repeated themes across sources: ${themes.slice(0,6).map(([t,n])=>`${t} (${n})`).join(', ')}.`,confidence:Math.min(95,55+themes[0][1]*6)});
  if(opportunities.length) insights.push({type:'opportunity',text:`Potential opportunity signals: ${opportunities.map(([t])=>t).join(', ')}. These are signals to validate, not guaranteed demand.`,confidence:Math.min(90,60+opportunities.length*6)});
  if(risks.length) insights.push({type:'risk',text:`Potential risks or friction signals: ${risks.map(([t])=>t).join(', ')}.`,confidence:Math.min(88,55+risks.length*6)});
  if(sourceTypes.size>=2) insights.push({type:'theme',text:`Evidence comes from ${[...sourceTypes].join(', ')} sources, reducing dependence on a single source type.`,confidence:82});
  const strongest=unique.slice(0,5).map(h=>`${h.title}${h.snippet?` — ${h.snippet.slice(0,220)}`:''}`).join(' ');
  const answer=`Research synthesis for "${question}": ${themes.length?`the strongest repeated signals are ${themes.slice(0,6).map(([x])=>x).join(', ')}.`:'the sources are related but do not show a strong repeated theme.'} ${opportunities.length?`The clearest opportunity signals are ${opportunities.map(([x])=>x).join(', ')}.`:''} ${risks.length?`Important friction/risk signals include ${risks.map(([x])=>x).join(', ')}.`:''} I compared ${unique.length} unique public sources across ${sourceTypes.size} source types. Highest-ranked evidence: ${strongest} This is a source-backed synthesis; individual claims should be checked against the linked originals.`;
  const follow=[`${question} statistics official`,`${question} competitors pricing`,`businesses in ${question} with contact details`,`customer complaints ${question}`];
  return {answer,insights,followUpQueries:follow};
}

export async function researchWeb(question: string): Promise<ResearchResponse> {
  const queries=plan(question); const warnings:string[]=[]; const hits:SearchHit[]=[];
  const settled=await Promise.allSettled(queries.flatMap(q=>[duck(q),news(q),reddit(q)]));
  settled.forEach(r=>r.status==='fulfilled'?hits.push(...r.value):warnings.push(r.reason instanceof Error?r.reason.message:'source failed'));
  const unique=[...new Map(hits.map(h=>[h.url,h])).values()];
  const synthesis=synthesize(question,unique);
  const sources=unique.map(h=>({...h,evidenceScore:h.evidenceScore||scoreSource(h,tokens(question))})).sort((a,b)=>(b.evidenceScore||0)-(a.evidenceScore||0)).slice(0,24);
  return {answer:synthesis.answer,sources,queries,warnings:[...new Set(warnings)],insights:synthesis.insights,followUpQueries:synthesis.followUpQueries};
}
