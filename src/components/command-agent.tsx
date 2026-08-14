'use client';
import { useState } from 'react';

export default function CommandAgent() {
  const [command, setCommand] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!command.trim() || busy) return;
    setBusy(true); setError(''); setResult(null);
    try {
      const response = await fetch('/api/command-agent', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ command, limit: 10 }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Command failed'); setResult(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Command failed'); } finally { setBusy(false); }
  }
  return <section className="command-agent" aria-label="AI Command Agent">
    <div className="command-agent-head"><div><span className="command-agent-kicker">AI COMMAND AGENT</span><h2>Tell me what you want done</h2><p>Describe the outcome in normal language. I’ll choose the right agents and run them.</p></div><span className="command-agent-live">● LIVE</span></div>
    <form onSubmit={submit} className="command-agent-form"><textarea value={command} onChange={e => setCommand(e.target.value)} placeholder="Example: Find trending AI opportunities on Reddit and then find businesses that could buy them." rows={3} /><button type="submit" disabled={busy || !command.trim()}>{busy ? 'Running agents…' : 'Run command →'}</button></form>
    <div className="command-agent-examples"><button type="button" onClick={() => setCommand('Find good leads for a web design service in Lagos')}>Find leads</button><button type="button" onClick={() => setCommand('Find what is trending in AI and the business opportunities')}>Find trends</button><button type="button" onClick={() => setCommand('Find government tenders for software companies')}>Find tenders</button></div>
    {error && <div className="command-agent-error">{error}</div>}
    {result && <div className="command-agent-result"><strong>{result.plan?.explanation}</strong><div className="command-agent-agents">{result.plan?.agents?.map((a: string) => <span key={a}>{a}</span>)}</div>{result.outputs?.map((item: any) => <details key={item.agent}><summary>{item.agent}</summary><pre>{JSON.stringify(item.result, null, 2)}</pre></details>)}</div>}
    <style jsx>{`.command-agent{margin:24px auto;max-width:1100px;padding:22px;border:1px solid #294353;border-radius:18px;background:#0b1822;box-shadow:0 12px 40px rgba(0,0,0,.18)}.command-agent-head{display:flex;justify-content:space-between;gap:16px}.command-agent-kicker{font-size:11px;letter-spacing:.16em;color:#7ee7c4;font-weight:800}.command-agent h2{margin:6px 0;font-size:25px}.command-agent p{margin:0;color:#8ea3b3}.command-agent-live{font-size:11px;color:#7ee7c4}.command-agent-form{display:grid;gap:10px;margin-top:18px}.command-agent textarea{width:100%;box-sizing:border-box;background:#07121b;color:#e8f3f7;border:1px solid #2a4655;border-radius:12px;padding:14px;font:inherit;resize:vertical}.command-agent button{border:1px solid #315567;background:#102633;color:#bfeee0;border-radius:9px;padding:10px 14px;cursor:pointer}.command-agent-form button{background:#74dfbd;color:#06140f;border:0;font-weight:800}.command-agent button:disabled{opacity:.5}.command-agent-examples{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.command-agent-result{margin-top:16px;padding:14px;border-radius:12px;background:#0e222d}.command-agent-agents{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.command-agent-agents span{padding:4px 8px;border-radius:999px;background:#183644;color:#9ee6d1;font-size:11px}.command-agent-result details{margin-top:8px}.command-agent-result pre{white-space:pre-wrap;overflow:auto;max-height:350px;font-size:11px;color:#b6c9d2}.command-agent-error{margin-top:12px;color:#ff9da5}`}</style>
  </section>;
}
