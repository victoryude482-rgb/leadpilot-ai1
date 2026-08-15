'use client';

import { useMemo, useState } from 'react';
import AuthBar from '@/components/auth-bar';
import QualityBadge from './quality-badge';
import './quality.css';

type Mode = 'custom'|'leads'|'trends'|'opportunities'|'tenders'|'ecommerce'|'competitors'|'outreach'|'content';
type Config = { label:string; title:string; question:string; placeholder:string; fields:string[]; build:(answer:string, fields:Record<string,string>)=>string };
type Output = { agent?: string; result?: any };
type AnyResult = { plan?:{explanation?:string;agents?:string[]}; outputs?:Output[]; error?:string };
type Lead = { id?:string; name:string; company?:string; title?:string; description?:string; industry?:string; source?:string; website?:string; url?:string; phone?:string; email?:string; address?:string; city?:string; country?:string; score?:number; business?:{name?:string;website?:string;phone?:string;email?:string;address?:string;city?:string;country?:string;industry?:string;source?:string}; lead?:{score?:number;scoreLabel?:string}; research?:{summary?:string;signals?:string[];missing?:string[];recommendedOffer?:string}; report?:{recommendation?:string;reliability?:{confidence?:number}; reasons?:string[]};};

const MODES:Record<Mode,Config>={
 custom:{label:'Anything',title:'Tell Victory AI what you want done',question:'What do you want me to do?',placeholder:'Example: Find what is trending on Reddit, identify the best business opportunities, then find real businesses I can contact.',fields:[],build:a=>a},
 leads:{label:'Find leads',title:'Find real business leads',question:'What kind of businesses or customers should I find?',placeholder:'Example: restaurants in Lagos that need better websites',fields:['Location','Industry','How many leads?'],build:(a,f)=>`Find ${f['How many leads?']||'10'} real business leads for: ${a}. Location: ${f.Location||'anywhere'}. Industry: ${f.Industry||'any'}.`},
 trends:{label:'Find trends',title:'Discover what is trending',question:'What market, topic, product or niche should I investigate?',placeholder:'Example: AI products and business ideas that are trending now',fields:['Market/location','Time window'],build:(a,f)=>`Find current trends for ${a}. Market/location: ${f['Market/location']||'global'}. Time window: ${f['Time window']||'recent'}. Use Reddit and other source-backed sources.`},
 opportunities:{label:'Find opportunities',title:'Turn demand into opportunities',question:'What business idea, problem or market should I turn into opportunities?',placeholder:'Example: problems people complain about that businesses can pay to solve',fields:['Target market','Budget'],build:(a,f)=>`Find actionable business opportunities around ${a}. Target market: ${f['Target market']||'global'}. Budget: ${f.Budget||'not specified'}.`},
 tenders:{label:'Find tenders',title:'Find procurement opportunities',question:'What type of contract or procurement opportunity should I find?',placeholder:'Example: software and cybersecurity contracts',fields:['Country/region','Deadline'],build:(a,f)=>`Find relevant public tenders/contracts for ${a}. Country/region: ${f['Country/region']||'global'}. Deadline: ${f.Deadline||'open'}.`},
 ecommerce:{label:'Find products',title:'Find ecommerce opportunities',question:'What product category or customer problem should I investigate?',placeholder:'Example: products people ask for on Reddit but cannot find easily',fields:['Target market','Price range'],build:(a,f)=>`Find ecommerce opportunities for ${a}. Target market: ${f['Target market']||'global'}. Price range: ${f['Price range']||'any'}.`},
 competitors:{label:'Monitor competitors',title:'Monitor competitor changes',question:'Which competitors, websites or market should I monitor?',placeholder:'Example: competitors to my web design agency',fields:['Industry','Alert focus'],build:(a,f)=>`Monitor public competitor changes for ${a}. Industry: ${f.Industry||'any'}. Alert focus: ${f['Alert focus']||'important changes'}.`},
 outreach:{label:'Create outreach',title:'Prepare personalized outreach',question:'Who are you trying to reach and what are you offering?',placeholder:'Example: restaurants that need online ordering',fields:['Offer','Tone'],build:(a,f)=>`Create approval-first personalized outreach for ${a}. Offer: ${f.Offer||'not specified'}. Tone: ${f.Tone||'professional'}.`},
 content:{label:'Create content',title:'Create business content',question:'What business, product or topic should I create content for?',placeholder:'Example: AI lead generation for small businesses',fields:['Audience','Content type'],build:(a,f)=>`Create practical business content about ${a}. Audience: ${f.Audience||'business owners'}. Content type: ${f['Content type']||'social posts and blog ideas'}`}
};

function rawRecords(value:any):any[]{
  const found:any[]=[];
  const walk=(v:any)=>{
    if(v==null)return;
    if(Array.isArray(v)){for(const x of v) walk(x);return;}
    if(typeof v!=='object')return;
    if(Array.isArray(v.results)) for(const x of v.results) found.push(x);
    for(const [k,x] of Object.entries(v)) if(k!=='results' && x && typeof x==='object') walk(x);
  };
  walk(value);
  return found;
}

function isBusinessRecord(item:any):boolean{
  const b=item?.business;
  if(b?.name) return true;
  const name=item?.company||item?.businessName;
  if(!name) return false;
  return Boolean(item.website||item.url||item.phone||item.email||item.address||item.city||item.country);
}

function asLead(item:any):Lead{
  return item as Lead;
}

function leadName(item:Lead){return item.business?.name||item.company||item.name||item.title||'Unnamed business';}
function leadIndustry(item:Lead){return item.business?.industry||item.industry||'Business';}
function leadWebsite(item:Lead){return item.business?.website||item.website||item.url;}
function leadPhone(item:Lead){return item.business?.phone||item.phone;}
function leadEmail(item:Lead){return item.business?.email||item.email;}
function leadLocation(item:Lead){return [item.business?.address||item.address,item.business?.city||item.city,item.business?.country||item.country].filter(Boolean).join(', ');}
function leadSource(item:Lead){return item.business?.source||item.source;}
function leadScore(item:Lead){return typeof item.lead?.score==='number'?item.lead.score:typeof item.score==='number'?item.score:undefined;}
function scoreLabel(item:Lead){return item.lead?.scoreLabel||'';}
function evidenceTitle(item:any){return item?.title||item?.name||item?.company||item?.business?.name||'Evidence';}
function evidenceDescription(item:any){return item?.description||item?.summary||item?.snippet||item?.business?.industry||item?.industry||item?.category||'Source evidence';}
function evidenceUrl(item:any){return item?.url||item?.link||item?.sourceUrl||item?.website;}
function evidenceSource(item:any){return item?.source||item?.publisher||item?.site||'';}

export default function CommandDashboard(){
  const [mode,setMode]=useState<Mode>('custom');
  const [answer,setAnswer]=useState('');
  const [fields,setFields]=useState<Record<string,string>>({});
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState<AnyResult|null>(null);
  const [error,setError]=useState('');
  const [selectedLead,setSelectedLead]=useState<Lead|null>(null);

  const config=MODES[mode];
  const command=useMemo(()=>config.build(answer,fields),[config,answer,fields]);

  const agentData=useMemo(()=>{
    const outputs=result?.outputs||[];
    const leadsOutput=outputs.filter(o=>o.agent==='lead-finder');
    const leadCandidates=leadsOutput.flatMap(o=>rawRecords(o.result)).map(asLead).filter(isBusinessRecord);
    const unique=new Map<string,Lead>();
    for(const l of leadCandidates){
      const key=(leadWebsite(l)||`${leadName(l)}|${leadLocation(l)}`).toLowerCase();
      if(!unique.has(key)) unique.set(key,l);
    }
    const leads=[...unique.values()];
    const evidence=outputs.filter(o=>o.agent!=='lead-finder').flatMap(o=>rawRecords(o.result).map(item=>({agent:o.agent||'agent',item})));
    return {leads,evidence,outputs};
  },[result]);

  function choose(m:Mode){setMode(m);setAnswer('');setFields({});setResult(null);setError('');setSelectedLead(null);}

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!answer.trim()||busy)return;
    setBusy(true);setError('');setResult(null);setSelectedLead(null);
    try{
      const r=await fetch('/api/command-agent',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({command,limit:25})});
      const d=await r.json();
      if(!r.ok) throw new Error(d.error||'Command failed');
      setResult(d);
    }catch(x){setError(x instanceof Error?x.message:'Command failed');}
    finally{setBusy(false);}
  }

  const good=agentData.leads.filter(x=>(leadScore(x)||0)>=70).length;
  const medium=agentData.leads.filter(x=>{const s=leadScore(x);return s!==undefined&&s>=40&&s<70;}).length;
  const bad=agentData.leads.filter(x=>{const s=leadScore(x);return s!==undefined&&s<40;}).length;

  return <div className="command-dashboard">
    <header className="cd-top"><div className="cd-brand"><span>VA</span><strong>Victory <b>AI</b></strong></div><div className="cd-account"><AuthBar onTokenChange={()=>{}}/></div></header>
    <main className="cd-main">
      <section className="cd-hero"><div><p className="cd-kicker">YOUR AI WORKSPACE</p><h1>What do you want<br/><em>Victory AI</em> to do?</h1><p>Describe the outcome in normal language. Victory AI chooses the right agents, separates research evidence from real business leads, verifies what it can and lets you inspect each lead.</p></div><div className="cd-status"><strong>9 AI AGENTS</strong><span>understand → research → find businesses → verify → score</span></div></section>
      <section className="cd-card"><div className="cd-card-head"><div><p className="cd-kicker">SMART COMMAND</p><h2>{config.title}</h2><span>{config.question}</span></div><div className="legend"><span className="good">● GOOD</span><span className="medium">● MEDIUM</span><span className="bad">● BAD</span></div></div>
        <div className="cd-modes">{(Object.keys(MODES) as Mode[]).map(m=><button key={m} type="button" className={m===mode?'active':''} onClick={()=>choose(m)}>{MODES[m].label}</button>)}</div>
        <div className="cd-hint">Research articles are kept as evidence. They are not counted as business leads.</div>
        <form onSubmit={submit} className="cd-form"><label>{config.question}<textarea value={answer} onChange={e=>setAnswer(e.target.value)} placeholder={config.placeholder} rows={4} required/></label>{config.fields.map(f=><label key={f}>{f}<input value={fields[f]||''} onChange={e=>setFields(v=>({...v,[f]:e.target.value}))} placeholder={`Enter ${f.toLowerCase()}`}/></label>)}<div className="cd-preview"><small>COMMAND PREVIEW</small><div>{command||'Your command will appear here.'}</div></div><button className="cd-run" disabled={busy||!answer.trim()}>{busy?'Working across the selected agents…':'Run job →'}</button></form>{error&&<div className="cd-error">{error}</div>}
      </section>

      {result&&<section className="cd-results">
        <div className="cd-result-head"><div><p className="cd-kicker">JOB RESULT</p><h2>{result.plan?.explanation||'Job completed'}</h2><p className="result-note">{agentData.outputs.length} agent(s) were used. Only verified business records are shown in the lead list.</p></div><div className="agents-used">{result.plan?.agents?.map(a=><span key={a}>{a}</span>)}</div></div>

        <div className="lead-summary"><b>{agentData.leads.length}</b><span>real business leads</span><span className="good">● {good} Good</span><span className="medium">● {medium} Medium</span><span className="bad">● {bad} Bad</span></div>

        {agentData.leads.length>0?<div className="lead-grid">{agentData.leads.map((item,i)=>{
          const s=leadScore(item); const src=leadWebsite(item); const label=scoreLabel(item);
          return <button key={item.id||`${leadName(item)}-${i}`} type="button" className="lead-card" onClick={()=>setSelectedLead(item)}>
            <div className="lead-card-head"><div className="avatar">{leadName(item).slice(0,1).toUpperCase()}</div><div className="lead-title"><h3>{leadName(item)}</h3><p>{leadIndustry(item)}</p></div>{s!==undefined&&<div className="score-box"><QualityBadge score={s}/><strong>{s}</strong></div>}</div>
            <div className="lead-meta"><span>{leadLocation(item)||'Location not listed'}</span>{leadWebsite(item)&&<span>Website available</span>}{(leadEmail(item)||leadPhone(item))&&<span>Contact available</span>}</div>
            <div className="lead-footer"><span>{leadSource(item)||'Business discovery source'}</span><b>Open full lead →</b></div>
          </button>;
        })}</div>:<div className="empty-leads"><strong>No real business leads were returned for this request.</strong><p>Research evidence may still be available below. Broaden the location or describe the type of business more specifically.</p></div>}

        {agentData.evidence.length>0&&<section className="evidence-section"><div className="section-head"><div><p className="cd-kicker">RESEARCH EVIDENCE</p><h3>Trends and market signals</h3></div><span>Evidence only — not counted as leads</span></div><div className="evidence-grid">{agentData.evidence.slice(0,30).map(({agent,item},i)=>{const href=evidenceUrl(item);return <article className="evidence-card" key={`${agent}-${i}`}><span className="evidence-agent">{agent}</span><h4>{evidenceTitle(item)}</h4><p>{evidenceDescription(item)}</p>{evidenceSource(item)&&<small>{evidenceSource(item)}</small>}{href&&<a href={href} target="_blank" rel="noreferrer">Open evidence ↗</a>}</article>})}</div></section>}

        <div className="agent-statuses">{agentData.outputs.map((o,i)=>{const rs=rawRecords(o.result);const r=o.result||{};const leadRecords=o.agent==='lead-finder'?rs.filter(isBusinessRecord):[];return <article key={`${o.agent}-${i}`} className="agent-status"><div className="agent-status-head"><strong>{o.agent||'Agent'}</strong><span>{o.agent==='lead-finder'?`${leadRecords.length} real leads`:`${rs.length} evidence records`}</span></div>{Array.isArray(r?.warnings)&&r.warnings.length>0&&<ul>{r.warnings.map((w:string,j:number)=><li key={j}>{w}</li>)}</ul>}{rs.length===0&&<p>{r?.message||r?.status||r?.error||'No source-backed records returned.'}</p>}</article>})}</div>
      </section>}

      {selectedLead&&<div className="modal-backdrop" onClick={()=>setSelectedLead(null)}><section className="lead-modal" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Lead details"><button type="button" className="modal-close" onClick={()=>setSelectedLead(null)}>×</button><div className="modal-head"><div className="avatar big">{leadName(selectedLead).slice(0,1).toUpperCase()}</div><div><p className="cd-kicker">REAL BUSINESS LEAD</p><h2>{leadName(selectedLead)}</h2><p>{leadIndustry(selectedLead)}</p></div>{leadScore(selectedLead)!==undefined&&<div className="modal-score"><QualityBadge score={leadScore(selectedLead)}/><strong>{leadScore(selectedLead)}/100</strong></div>}</div><div className="detail-grid"><div><small>LOCATION</small><strong>{leadLocation(selectedLead)||'Not listed'}</strong></div><div><small>WEBSITE</small>{leadWebsite(selectedLead)?<a href={leadWebsite(selectedLead)} target="_blank" rel="noreferrer">Open website ↗</a>:<strong>Not listed</strong>}</div><div><small>EMAIL</small><strong>{leadEmail(selectedLead)||'Not listed'}</strong></div><div><small>PHONE</small><strong>{leadPhone(selectedLead)||'Not listed'}</strong></div></div>{selectedLead.research&&<div className="detail-section"><h3>AI research</h3><p>{selectedLead.research.summary||'No summary available.'}</p>{selectedLead.research.recommendedOffer&&<div className="offer"><small>RECOMMENDED OFFER</small><strong>{selectedLead.research.recommendedOffer}</strong></div>}{selectedLead.research.signals?.length&&<div className="chips">{selectedLead.research.signals.map((x,i)=><span key={i}>{x}</span>)}</div>}</div>}{selectedLead.report&&<div className="detail-section"><h3>Verification</h3><p><strong>{selectedLead.report.recommendation||'REVIEW'}</strong>{selectedLead.report.reliability?.confidence!==undefined?` · ${selectedLead.report.reliability.confidence}% confidence`:''}</p>{selectedLead.report.reasons?.length&&<ul>{selectedLead.report.reasons.slice(0,8).map((x,i)=><li key={i}>{x}</li>)}</ul>}</div>}<button type="button" className="modal-done" onClick={()=>setSelectedLead(null)}>Done</button></section></div>}
    </main>
    <footer className="cd-footer">Victory AI · real business leads · evidence-aware research</footer>

    <style jsx>{`
      .command-dashboard{position:fixed;inset:0;z-index:9998;overflow:auto;background:#06101b;color:#eaf2f8;font-family:Inter,system-ui,sans-serif}
      .cd-top{min-height:68px;padding:0 28px;display:flex;align-items:center;justify-content:space-between;gap:18px;border-bottom:1px solid #1d3040;background:#07131f;position:sticky;top:0;z-index:10}.cd-brand{display:flex;align-items:center;gap:10px;font-size:20px;white-space:nowrap}.cd-brand>span{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;background:#123c3a;color:#7ee7c4;font-size:11px}.cd-brand b,.cd-hero em{color:#7ee7c4;font-style:normal}.cd-account{display:flex;justify-content:flex-end;min-width:0}
      .cd-main{max-width:1120px;margin:auto;padding:34px 24px}.cd-hero{display:flex;justify-content:space-between;align-items:end;gap:30px;padding:34px 0}.cd-kicker{margin:0 0 8px;color:#6dd8b5;font-size:10px;font-weight:800;letter-spacing:.16em}.cd-hero h1{font-size:clamp(42px,7vw,72px);line-height:.96;letter-spacing:-.05em;margin:0}.cd-hero>div:first-child p:last-child{max-width:700px;color:#91a6b6;line-height:1.6}.cd-status{min-width:210px;padding:20px;border:1px solid #243a4b;border-radius:16px;background:#0b1824;display:flex;flex-direction:column;gap:7px}.cd-status span{font-size:11px;color:#7d94a5;line-height:1.4}
      .cd-card,.cd-results{border:1px solid #274052;border-radius:20px;background:#0b1824;padding:24px;box-shadow:0 15px 45px rgba(0,0,0,.18)}.cd-result-head,.cd-card-head,.section-head{display:flex;justify-content:space-between;gap:20px;align-items:flex-start}.cd-card h2,.cd-results h2{margin:0 0 6px;font-size:25px}.cd-card-head>div:first-child>span{color:#8ea3b3;font-size:13px}.legend{display:flex;gap:10px;font-size:9px;letter-spacing:.08em}.good{color:#58e0aa}.medium{color:#e8cc55}.bad{color:#ff6975}
      .cd-modes{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0 10px}.cd-modes button{border:1px solid #2b4557;background:#0f2431;color:#a9e7d6;border-radius:999px;padding:9px 12px;font-size:11px;cursor:pointer}.cd-modes button.active{background:#74dfbd;color:#06140f;border-color:#74dfbd;font-weight:800}.cd-hint{color:#6f8799;font-size:10px;line-height:1.5;margin-bottom:14px}
      .cd-form{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.cd-form label{display:grid;gap:7px;color:#8ea3b3;font-size:10px}.cd-form label:first-child{grid-column:1/-1}.cd-form textarea,.cd-form input{width:100%;box-sizing:border-box;background:#07121b;color:#e8f3f7;border:1px solid #2a4655;border-radius:10px;padding:13px;font:inherit;outline:none}.cd-form textarea{resize:vertical}.cd-preview{grid-column:1/-1;border:1px solid #243b4b;border-radius:10px;background:#08141e;padding:12px}.cd-preview small{color:#6dd8b5;font-size:8px;letter-spacing:.14em}.cd-preview div{margin-top:6px;color:#c0d0d9;font-size:12px;line-height:1.45}.cd-run{grid-column:1/-1;height:50px;border:0;border-radius:10px;background:#74dfbd;color:#06140f;font-weight:900;cursor:pointer}.cd-run:disabled{opacity:.5}.cd-error{margin-top:12px;color:#ff9da5}
      .cd-results{margin-top:22px}.result-note{color:#7e94a5;font-size:11px;line-height:1.5}.agents-used{display:flex;gap:6px;flex-wrap:wrap}.agents-used span{padding:5px 8px;border-radius:999px;background:#17323d;color:#9fe5d3;font-size:9px}.lead-summary{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:18px 0;padding:11px 12px;border:1px solid #203748;border-radius:10px;color:#8298a8;font-size:10px}.lead-summary>b{font-size:22px;color:#eaf2f8}.lead-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.lead-card{width:100%;padding:17px;text-align:left;background:#0a1722;color:#eaf2f8;border:1px solid #254050;border-radius:16px;cursor:pointer}.lead-card:hover,.lead-card:focus-visible{border-color:#74dfbd;outline:none;transform:translateY(-1px)}.lead-card-head{display:flex;align-items:center;gap:12px}.avatar{width:42px;height:42px;border-radius:12px;background:#17323b;color:#7ee7c4;display:grid;place-items:center;font-weight:800;flex:none}.avatar.big{width:52px;height:52px;font-size:20px}.lead-title{min-width:0}.lead-title h3{margin:0;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.lead-title p{margin:4px 0 0;color:#8196a6;font-size:11px}.score-box{margin-left:auto;display:flex;align-items:center;gap:7px}.score-box strong{font-size:18px;color:#eaf2f8}.lead-meta{display:flex;gap:8px;flex-wrap:wrap;margin:15px 0;color:#7f95a5;font-size:10px}.lead-footer{display:flex;justify-content:space-between;gap:10px;border-top:1px solid #1d3040;padding-top:11px;color:#627b8d;font-size:9px}.lead-footer b{color:#7ee7c4}.empty-leads{padding:30px;border:1px dashed #2b4657;border-radius:14px;text-align:center;color:#8ea2b1}.evidence-section{margin-top:26px;padding-top:22px;border-top:1px solid #203748}.section-head h3{margin:0;font-size:19px}.section-head>span{color:#6f8799;font-size:10px}.evidence-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px}.evidence-card{border:1px solid #203748;background:#08141e;border-radius:13px;padding:14px}.evidence-agent{font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:#6dd8b5}.evidence-card h4{margin:8px 0 6px;font-size:13px;line-height:1.35}.evidence-card p{margin:0 0 8px;color:#8296a6;font-size:10px;line-height:1.5}.evidence-card small{display:block;color:#718798;font-size:9px;margin-bottom:8px}.evidence-card a{color:#7ee7c4;text-decoration:none;font-size:10px}.agent-statuses{display:grid;gap:8px;margin-top:18px}.agent-status{border:1px solid #203748;background:#08141e;border-radius:12px;padding:12px}.agent-status-head{display:flex;justify-content:space-between;gap:10px;color:#9be4d2;font-size:11px}.agent-status p,.agent-status li{margin:7px 0 0;color:#7f95a5;font-size:10px;line-height:1.45}.agent-status ul{margin:7px 0 0;padding-left:18px}
      .modal-backdrop{position:fixed;inset:0;z-index:30;background:rgba(0,0,0,.72);display:grid;place-items:center;padding:18px}.lead-modal{position:relative;width:min(760px,100%);max-height:92vh;overflow:auto;background:#0b1824;border:1px solid #315064;border-radius:20px;padding:22px}.modal-close{position:absolute;right:12px;top:8px;background:transparent;border:0;color:#b6c8d4;font-size:30px;cursor:pointer}.modal-head{display:flex;gap:13px;align-items:center;padding-right:30px}.modal-head h2{margin:0;font-size:24px}.modal-head p:not(.cd-kicker){margin:5px 0 0;color:#8ca1b1}.modal-score{margin-left:auto;display:flex;flex-direction:column;align-items:center;gap:5px}.modal-score strong{font-size:24px;color:#7ee7c4}.detail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:22px 0}.detail-grid>div{padding:13px;border:1px solid #203748;border-radius:12px;background:#08141e}.detail-grid small,.offer small{display:block;color:#6f8799;font-size:8px;letter-spacing:.12em;margin-bottom:6px}.detail-grid strong,.detail-grid a{font-size:11px;overflow-wrap:anywhere;color:#e2eef3}.detail-grid a{color:#7ee7c4;text-decoration:none}.detail-section{border-top:1px solid #203748;padding-top:17px;margin-top:17px}.detail-section h3{margin:0 0 8px;font-size:16px}.detail-section p,.detail-section li{color:#94a8b7;font-size:11px;line-height:1.6}.offer{margin:12px 0;padding:12px;border:1px solid #315748;border-radius:10px;background:#10231f}.offer strong{color:#a8dfcb;font-size:11px}.chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.chips span{background:#132b2b;color:#8ed9c2;border-radius:999px;padding:6px 8px;font-size:9px}.modal-done{width:100%;height:45px;margin-top:20px;border:0;border-radius:9px;background:#74dfbd;color:#06140f;font-weight:900;cursor:pointer}.cd-footer{text-align:center;color:#5f7486;font-size:10px;padding:32px 0 16px}
      @media(max-width:900px){.cd-hero{display:block}.cd-status{margin-top:18px}.evidence-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.lead-grid{grid-template-columns:1fr}}
      @media(max-width:640px){.cd-top{padding:0 16px}.cd-main{padding:22px 14px}.cd-card,.cd-results{padding:16px}.cd-card-head,.cd-result-head,.section-head{display:block}.legend{margin-top:12px}.cd-form{grid-template-columns:1fr}.cd-form label:first-child{grid-column:auto}.cd-preview,.cd-run{grid-column:auto}.evidence-grid{grid-template-columns:1fr}.detail-grid{grid-template-columns:1fr}.modal-head{align-items:flex-start}.modal-score{margin-left:auto}.cd-hero h1{font-size:45px}}
    `}</style>
  </div>;
}
