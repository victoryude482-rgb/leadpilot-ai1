export type ResearchSource = { title: string; url: string; source: string; snippet?: string; publishedAt?: string };
export type ResearchResult = { answer: string; sources: ResearchSource[]; queries: string[]; warnings: string[] };

type SearchHit = ResearchSource;

const STOP = new Set(['what','where','when','which','about','find','show','give','tell','me','the','for','and','with','from','that','this','business','businesses','company','companies','best','good','real','actual','near']);
function tokens(text: string) { return [...new Set(text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter(x => x.length > 2 && !STOP.has(x)))]; }
function cleanHtml(value: string) { return value.replace(/<[^>]+>/g, ' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim(); }

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
    if (title && /^https?:/i.test(href)) out.push({ title, url: href, source: 'DuckDuckGo', snippet });
  }
  return out;
}

async function news(query: string): Promise<SearchHit[]> {
  const url = new URL('https://news.google.com/rss/search'); url.searchParams.set('q', query); url.searchParams.set('hl','en-US'); url.searchParams.set('gl','US'); url.searchParams.set('ceid','US:en');
  const res = await fetch(url, { headers: { accept: 'application/rss+xml' }, signal: AbortSignal.timeout(5000) }); if (!res.ok) throw new Error(`Google News ${res.status}`);
  const xml = await res.text(); const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  const get = (s:string,n:string) => s.match(new RegExp(`<${n}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${n}>`,'i'))?.[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim() || '';
  return items.slice(0,8).map(i => ({ title:get(i,'title'), url:get(i,'link'), source:`Google News · ${get(i,'source') || 'News'}`, snippet:get(i,'description'), publishedAt:get(i,'pubDate') })).filter(x => x.title && x.url);
}

async function reddit(query: string): Promise<SearchHit[]> {
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&limit=8`;
  const res = await fetch(url, { headers: { 'user-agent': 'LeadPilotAI/1.0 research' }, signal: AbortSignal.timeout(5000) }); if (!res.ok) throw new Error(`Reddit ${res.status}`);
  const data = await res.json() as any; const children = data?.data?.children; if (!Array.isArray(children)) return [];
  return children.map((c:any) => { const p=c?.data; return p?.title ? { title:p.title, url:p.permalink ? `https://www.reddit.com${p.permalink}` : '', source:`Reddit · r/${p.subreddit || 'unknown'}`, snippet:typeof p.selftext==='string'?p.selftext.slice(0,400):'' } : null; }).filter((x:any):x is SearchHit => Boolean(x?.title && x.url));
}

function plan(question: string): string[] {
  const t = question.trim(); const w=tokens(t); const core=w.slice(0,10).join(' ');
  return [...new Set([t, `${core} latest trends market`, `${core} businesses companies directory`, `${core} problems customer demand`, `${core} reviews discussions Reddit`])].slice(0,5);
}

function synthesize(question: string, hits: SearchHit[]): string {
  const unique = [...new Map(hits.map(h => [h.url,h])).values()];
  if (!unique.length) return `I couldn't find enough public evidence to answer "${question}" reliably.`;
  const topics = new Map<string, number>();
  for (const h of unique) for (const t of tokens(h.title)) topics.set(t,(topics.get(t)||0)+1);
  const repeated=[...topics.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([x])=>x);
  const evidence = unique.slice(0,6).map(h => `${h.title}${h.snippet ? ` — ${h.snippet.slice(0,180)}` : ''}`).join(' ');
  return `Research summary for "${question}": public sources repeatedly point to ${repeated.join(', ') || 'several related themes'}. I checked multiple source types rather than relying on one result. The strongest evidence is: ${evidence} This is an evidence-based synthesis of retrieved pages, not a claim that every source is correct.`;
}

export async function researchWeb(question: string): Promise<ResearchResult> {
  const queries=plan(question); const warnings:string[]=[]; const hits:SearchHit[]=[];
  const jobs=queries.flatMap(q=>[duck(q), news(q), reddit(q)]);
  const settled=await Promise.allSettled(jobs); settled.forEach((r)=>r.status==='fulfilled'?hits.push(...r.value):warnings.push(r.reason instanceof Error?r.reason.message:'source failed'));
  const sources=[...new Map(hits.map(h=>[h.url,h])).values()].slice(0,20);
  return { answer:synthesize(question,sources), sources, queries, warnings:[...new Set(warnings)] };
}
