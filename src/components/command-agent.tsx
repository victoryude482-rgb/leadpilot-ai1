'use client';

import { useMemo, useState } from 'react';

type Mode = 'custom' | 'leads' | 'trends' | 'opportunities' | 'tenders' | 'ecommerce' | 'competitors' | 'outreach' | 'content';
type ModeConfig = { label: string; question: string; placeholder: string; fields: string[]; build: (answer: string, fields: Record<string,string>) => string };

const MODES: Record<Mode, ModeConfig> = {
  custom: { label: 'Anything', question: 'What do you want me to do?', placeholder: 'Describe the outcome you want in normal language…', fields: [], build: (a) => a },
  leads: { label: 'Find leads', question: 'What kind of businesses or customers should I find?', placeholder: 'e.g. businesses that need websites', fields: ['Location', 'Industry', 'How many leads?'], build: (a,f) => `Find ${f['How many leads?']||'10'} good business leads for: ${a}. Location: ${f.Location||'anywhere'}. Industry: ${f.Industry||'any'}.` },
  trends: { label: 'Find trends', question: 'What market, topic, product or niche should I investigate?', placeholder: 'e.g. AI tools, fashion, ecommerce', fields: ['Market/location', 'Time window'], build: (a,f) => `Find current trends for ${a}. Market/location: ${f['Market/location']||'global'}. Time window: ${f['Time window']||'recent'}. Use Reddit and other source-backed sources.` },
  opportunities: { label: 'Find opportunities', question: 'What business idea, problem or market should I turn into opportunities?', placeholder: 'e.g. businesses struggling with customer support', fields: ['Target market', 'Budget'], build: (a,f) => `Find actionable business opportunities around ${a}. Target market: ${f['Target market']||'global'}. Budget: ${f.Budget||'not specified'}.` },
  tenders: { label: 'Find tenders', question: 'What type of contract or procurement opportunity should I find?', placeholder: 'e.g. software, construction, cybersecurity', fields: ['Country/region', 'Deadline'], build: (a,f) => `Find relevant public tenders/contracts for ${a}. Country/region: ${f['Country/region']||'global'}. Deadline: ${f.Deadline||'open'}.` },
  ecommerce: { label: 'Find products', question: 'What product category or customer problem should I investigate?', placeholder: 'e.g. products people are asking for on Reddit', fields: ['Target market', 'Price range'], build: (a,f) => `Find ecommerce opportunities for ${a}. Target market: ${f['Target market']||'global'}. Price range: ${f['Price range']||'any'}.` },
  competitors: { label: 'Monitor competitors', question: 'Which competitors, websites or market should I monitor?', placeholder: 'e.g. competitors to my web design agency', fields: ['Industry', 'Alert focus'], build: (a,f) => `Monitor public competitor changes for ${a}. Industry: ${f.Industry||'any'}. Alert focus: ${f['Alert focus']||'important changes'}.` },
  outreach: { label: 'Create outreach', question: 'Who are you trying to reach and what are you offering?', placeholder: 'e.g. restaurants that need online ordering', fields: ['Offer', 'Tone'], build: (a,f) => `Create approval-first personalized outreach for ${a}. Offer: ${f.Offer||'not specified'}. Tone: ${f.Tone||'professional'}.` },
  content: { label: 'Create content', question: 'What business, product or topic should I create content for?', placeholder: 'e.g. AI lead generation for small businesses', fields: ['Audience', 'Content type'], build: (a,f) => `Create practical business content about ${a}. Audience: ${f.Audience||'business owners'}. Content type: ${f['Content type']||'social posts and blog ideas'}.` },
};

export default function CommandAgent() {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<Mode>('custom');
  const [answer, setAnswer] = useState('');
  const [fields, setFields] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const config = MODES[mode];
  const command = useMemo(() => config.build(answer, fields), [config, answer, fields]);
  function choose(next: Mode) { setMode(next); setAnswer(''); setFields({}); setResult(null); setError(''); }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!command.trim() || busy) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const response = await fetch('/api/command-agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ command, limit: 10 }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Command failed'); setResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Command failed'); } finally { setBusy(false); }
  }
  return <>
    <button type="button" className="command-launcher" onClick={() => setOpen(v => !v)} aria-expanded={open}>✦ <span>AI Command</span></button>
    {open && <section className="command-agent" aria-label="AI Command Agent">
      <div className="command-agent-head"><div><span className="command-agent-kicker">AI COMMAND AGENT</span><h2>Tell Victory AI what you want done</h2><p>The dashboard changes its questions based on the job you choose.</p></div><button type="button" className="command-close" onClick={() => setOpen(false)}>×</button></div>
      <div className="command-modes">{(Object.keys(MODES) as Mode[]).map(key => <button key={key} type="button" className={mode===key?'active':''} onClick={() => choose(key)}>{MODES[key].label}</button>)}</div>
      <form onSubmit={submit} className="command-agent-form">
        <label>{config.question}<textarea value={answer} onChange={e => setAnswer(e.target.value)} placeholder={config.placeholder} rows={3} required /></label>
        {config.fields.map(field => <label key={field}>{field}<input value={fields[field]||''} onChange={e => setFields(v => ({...v, [field]: e.target.value}))} placeholder={`Enter ${field.toLowerCase()}`} /></label>)}
        <div className="command-preview"><span>WHAT I'LL RUN</span><p>{command || 'Your instruction will appear here.'}</p></div>
        <button type="submit" disabled={busy || !answer.trim()} className="run-command">{busy ? 'Running agents…' : 'Run this job →'}</button>
      </form>
      {error && <div className="command-agent-error">{error}</div>}
      {result && <div className="command-agent-result"><strong>{result.plan?.explanation || 'Job completed'}</strong><div className="command-agent-agents">{result.plan?.agents?.map((a: string) => <span key={a}>{a}</span>)}</div>{result.outputs?.map((item: any) => <details key={item.agent}><summary>{item.agent}</summary><pre>{JSON.stringify(item.result, null, 2)}</pre></details>)}</div>}
      <style jsx>{`
        .command-launcher{position:fixed;right:16px;bottom:16px;z-index:10000;border:1px solid #315567;background:#102633;color:#bfeee0;border-radius:999px;padding:12px 16px;box-shadow:0 10px 35px rgba(0,0,0,.35);font-weight:800;cursor:pointer}.command-launcher span{margin-left:5px}
        .command-agent{position:fixed;right:16px;bottom:68px;z-index:9999;width:min(680px,calc(100vw - 32px));max-height:calc(100vh - 100px);overflow:auto;padding:22px;border:1px solid #294353;border-radius:18px;background:#0b1822;color:#e8f3f7;box-shadow:0 18px 60px rgba(0,0,0,.55)}
        .command-agent-head{display:flex;justify-content:space-between;gap:16px}.command-agent-kicker{font-size:10px;letter-spacing:.16em;color:#7ee7c4;font-weight:800}.command-agent h2{margin:6px 0;font-size:23px}.command-agent p{margin:0;color:#8ea3b3}.command-close{background:transparent!important;border:0!important;color:#9db0bd;font-size:26px;padding:0!important;cursor:pointer}
        .command-modes{display:flex;gap:7px;flex-wrap:wrap;margin:18px 0 10px}.command-modes button{border:1px solid #315567;background:#102633;color:#bfeee0;border-radius:999px;padding:7px 10px;font-size:11px;cursor:pointer}.command-modes button.active{background:#74dfbd;color:#06140f;border-color:#74dfbd;font-weight:800}
        .command-agent-form{display:grid;gap:10px}.command-agent-form label{font-size:10px;color:#8fa3b5;display:grid;gap:6px}.command-agent textarea,.command-agent input{width:100%;box-sizing:border-box;background:#07121b;color:#e8f3f7;border:1px solid #2a4655;border-radius:10px;padding:12px;font:inherit;outline:none}.command-agent textarea{resize:vertical}.command-preview{padding:11px;border:1px solid #243b4b;border-radius:10px;background:#08141e}.command-preview span{font-size:9px;letter-spacing:.12em;color:#6dd8b5;font-weight:800}.command-preview p{margin-top:5px;font-size:12px;line-height:1.45}.run-command{height:45px;border:0;border-radius:9px;background:#74dfbd;color:#06140f;font-weight:800;cursor:pointer}.run-command:disabled{opacity:.5}.command-agent-result{margin-top:12px;padding:13px;border-radius:10px;background:#0e222d}.command-agent-agents{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.command-agent-agents span{padding:4px 8px;border-radius:999px;background:#183644;color:#9ee6d1;font-size:11px}.command-agent-result pre{white-space:pre-wrap;overflow:auto;max-height:260px;font-size:10px;color:#b6c9d2}.command-agent-error{margin-top:12px;color:#ff9da5}
        @media(max-width:600px){.command-agent{right:8px;bottom:62px;width:calc(100vw - 16px);padding:16px}.command-launcher{right:10px;bottom:10px}.command-agent h2{font-size:19px}}
      `}</style>
    </section>}
  </>;
}
