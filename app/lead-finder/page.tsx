'use client';

import { FormEvent, useState } from 'react';
import { searchLeadFinder, searchTrendLeads } from '../../src/api/lead-finder-client';
import { researchQuestion, type ResearchResponse } from '../../src/api/research-client';
import LeadQualityBadge from '../../components/lead-quality-badge';

type Lead = { lead?: { id?: string; score?: number; scoreLabel?: string; status?: string }; business?: { name?: string; website?: string; phone?: string; email?: string; city?: string; country?: string; industry?: string }; report?: { confidence?: number; level?: string; recommendation?: string } };
type Trend = { title: string; source: string; url?: string; community?: string; relevance: number };
type SearchResult = { results?: Lead[]; count?: number; warnings?: string[]; error?: string; trends?: Trend[]; strategy?: string[] };

type SmartResearch = ResearchResponse & {
  insights?: Array<{ type: string; text: string; confidence: number }>;
  followUpQueries?: string[];
  sources?: Array<{ title: string; url: string; source: string; snippet?: string; publishedAt?: string; evidenceScore?: number; evidenceType?: string }>;
};

export default function LeadFinderPage() {
  const [filters, setFilters] = useState({ industry: '', country: '', city: '', keywords: '', limit: 25 });
  const [trendMode, setTrendMode] = useState(true);
  const [state, setState] = useState<'idle'|'loading'|'done'|'error'>('idle');
  const [result, setResult] = useState<SearchResult>({});
  const [question, setQuestion] = useState('');
  const [research, setResearch] = useState<SmartResearch>({});
  const [researching, setResearching] = useState(false);

  async function submit(event: FormEvent) { event.preventDefault(); setState('loading'); try { const body=trendMode?await searchTrendLeads(filters):await searchLeadFinder(filters); setResult(body as SearchResult); setState('done'); } catch(error){ setResult({error:error instanceof Error?error.message:'Search failed'}); setState('error'); } }
  async function researchNow(event: FormEvent) { event.preventDefault(); if(!question.trim()) return; setResearching(true); setResearch({}); try { setResearch(await researchQuestion(question) as SmartResearch); } catch(error){ setResearch({error:error instanceof Error?error.message:'Research failed'}); } finally { setResearching(false); } }

  return <main style={{maxWidth:960,margin:'0 auto',padding:32,fontFamily:'system-ui'}}>
    <h1>LeadPilot AI</h1>
    <p>Research first, then discover and verify businesses. The research agent searches multiple public source types, ranks evidence, identifies repeated signals and proposes the next questions to investigate.</p>

    <section style={{marginTop:24,padding:18,border:'1px solid #ddd',borderRadius:14}}>
      <h2>AI Research Agent</h2>
      <p style={{opacity:.7}}>Perplexity-style workflow: plan → search → compare → rank evidence → synthesize → suggest follow-ups.</p>
      <form onSubmit={researchNow} style={{display:'flex',gap:8}}>
        <input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Research: AI automation opportunities for restaurants in Nigeria" style={{flex:1}} />
        <button disabled={researching}>{researching?'Researching…':'Research'}</button>
      </form>
      {research.error && <p role="alert">{research.error}</p>}
      {research.answer && <div style={{marginTop:16,padding:14,background:'#f6f6f6',borderRadius:10}}><strong>AI synthesis</strong><p>{research.answer}</p></div>}

      {research.insights?.length ? <section style={{marginTop:16}}><h3>Evidence insights</h3><div style={{display:'grid',gap:8}}>{research.insights.map((x,i)=><article key={i} style={{padding:10,border:'1px solid #eee',borderRadius:9}}><strong>{x.type.toUpperCase()} · {x.confidence}% confidence</strong><p style={{margin:'5px 0 0'}}>{x.text}</p></article>)}</div></section> : null}
      {research.queries?.length ? <details style={{marginTop:10}}><summary>Search plan ({research.queries.length} queries)</summary><ul>{research.queries.map(q=><li key={q}>{q}</li>)}</ul></details> : null}

      {research.sources?.length ? <div style={{marginTop:16}}><h3>Ranked evidence ({research.sources.length})</h3>{research.sources.map((s,i)=><article key={`${s.url}-${i}`} style={{padding:'10px 0',borderBottom:'1px solid #eee'}}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><a href={s.url} target="_blank" rel="noreferrer"><strong>{i+1}. {s.title}</strong></a><span style={{fontSize:12,fontWeight:700}}>Evidence {s.evidenceScore ?? 0}/100</span></div><div style={{fontSize:12,opacity:.7}}>{s.source}{s.evidenceType?` · ${s.evidenceType}`:''}{s.publishedAt?` · ${s.publishedAt}`:''}</div>{s.snippet&&<div style={{fontSize:13,marginTop:4}}>{s.snippet.slice(0,300)}</div>}</article>)}</div>:null}

      {research.followUpQueries?.length ? <details style={{marginTop:14}} open><summary>Recommended next research</summary><ul>{research.followUpQueries.map(q=><li key={q}><button type="button" onClick={()=>setQuestion(q)} style={{textAlign:'left',border:0,background:'transparent',cursor:'pointer',padding:4}}>{q}</button></li>)}</ul></details> : null}
      {research.warnings?.length ? <p style={{fontSize:12,opacity:.7}}>Some sources unavailable: {research.warnings.join(' · ')}</p>:null}
    </section>

    <section style={{marginTop:28}}><h2>Lead Finder</h2><p>Trend-first discovery: public signals first, then real businesses from multiple providers.</p>
      <form onSubmit={submit} style={{display:'grid',gap:12,marginTop:16}}>
        {(['industry','country','city','keywords'] as const).map(key=><input key={key} value={filters[key]} placeholder={key==='keywords'?'Try: AI automation for restaurants':key} onChange={e=>setFilters({...filters,[key]:e.target.value})}/>)}
        <label style={{display:'flex',alignItems:'center',gap:8}}><input type="checkbox" checked={trendMode} onChange={e=>setTrendMode(e.target.checked)}/>Trend-first search (Reddit + News → real-business discovery)</label>
        <button disabled={state==='loading'} type="submit">{state==='loading'?'Finding leads…':trendMode?'Find trending opportunities':'Find leads'}</button>
      </form>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:16,fontSize:12}}><LeadQualityBadge score={85}/><LeadQualityBadge score={55}/><LeadQualityBadge score={25}/><span style={{opacity:.7,alignSelf:'center'}}>Green = good · Yellow = medium · Red = bad</span></div>
      {result.error&&<p role="alert">{result.error}</p>}{state==='done'&&<p>{result.count??result.results?.length??0} leads found.</p>}
      {trendMode&&result.trends?.length?<section style={{marginTop:20,padding:16,border:'1px solid #ddd',borderRadius:12}}><h2>Trending signals</h2>{result.trends.map((trend,index)=><div key={`${trend.source}-${index}`} style={{padding:'10px 0',borderBottom:'1px solid #eee'}}><strong>{trend.title}</strong><div style={{fontSize:13,opacity:.75}}>{trend.source}{trend.community?` · ${trend.community}`:''} · relevance {trend.relevance}/100</div>{trend.url&&<a href={trend.url} target="_blank" rel="noreferrer">View signal</a>}</div>)}</section>:null}
      <section style={{display:'grid',gap:16,marginTop:16}}>{(result.results??[]).map((item,index)=><article key={item.lead?.id??index} style={{border:'1px solid #ddd',borderRadius:12,padding:16}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><h2>{item.business?.name??'Unknown business'}</h2><LeadQualityBadge score={item.lead?.score}/></div><p>{item.business?.industry??'Industry unknown'} · {item.business?.city??''} {item.business?.country??''}</p><p>Score: <strong>{item.lead?.score??0}</strong> ({item.lead?.scoreLabel??'UNRATED'})</p><p>Reliability: {item.report?.level??'Pending'} {item.report?.confidence!=null?`(${item.report.confidence}%)`:''}</p><p>Recommendation: {item.report?.recommendation??'Review'}</p>{item.business?.website&&<a href={item.business.website} target="_blank" rel="noreferrer">Website</a>}</article>)}</section>
      {result.strategy?.length?<p>Strategy: {result.strategy.join(' · ')}</p>:null}{result.warnings?.length?<p>Provider warnings: {result.warnings.join(' · ')}</p>:null}
    </section>
  </main>;
}
