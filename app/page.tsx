'use client';

import { FormEvent, useMemo, useState } from 'react';
import AuthBar from '@/components/auth-bar';

type Lead = {
  id?: string;
  business?: { name?: string; website?: string; industry?: string; location?: string; city?: string; country?: string; phone?: string; email?: string };
  name?: string;
  company?: string;
  email?: string;
  website?: string;
  phone?: string;
  score?: number;
  status?: string;
  verification?: { status?: string };
  report?: { reliability?: { confidence?: number; level?: string }; recommendation?: string };
};

type SearchResponse = {
  leads?: Lead[];
  results?: Lead[];
  count?: number;
  warnings?: string[];
  message?: string;
  error?: string;
};

export default function Home() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [industry, setIndustry] = useState('');
  const [limit, setLimit] = useState('10');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const visibleLeads = useMemo(() => leads, [leads]);

  async function searchLeads(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setWarnings([]);
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (token) headers.authorization = `Bearer ${token}`;
      const response = await fetch('/api/leads/search', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          keywords: query,
          city: location,
          industry,
          limit: Number(limit),
        }),
      });
      const data = (await response.json()) as SearchResponse;
      if (!response.ok) throw new Error(data.error || data.message || `Search failed (${response.status})`);
      setLeads(data.leads || data.results || []);
      setWarnings(data.warnings || []);
      if (!(data.leads || data.results || []).length) {
        setError('No matching businesses were found in that area. Try a broader city, country, or keyword.');
      }
    } catch (err) {
      setLeads([]);
      setError(err instanceof Error ? err.message : 'Unable to search right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><span className="logo">LP</span><span>LeadPilot <b>AI</b></span></div>
        <div className="topActions"><span className="badge">B2B LEAD INTELLIGENCE</span><AuthBar onTokenChange={setToken} /></div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">CONNECTED SALES WORKSPACE</p>
          <h1>Find better leads.<br /><span>Move faster.</span></h1>
          <p className="subtitle">Discover, verify and score B2B prospects from one workspace.</p>
        </div>
        <div className="heroCard"><strong>Lead Finder</strong><span>search → verify → score → manage</span></div>
      </section>

      <section className="panel">
        <div className="panelTitle"><div><h2>Lead Finder</h2><p>Tell LeadPilot who you want to sell to.</p></div><span className="live"><i /> {token ? 'SIGNED IN' : 'PUBLIC SEARCH'}</span></div>
        <form onSubmit={searchLeads} className="form">
          <label>What are you looking for<input value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. laptops, computer shops, fintech" /></label>
          <label>Location<input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Lagos" /></label>
          <label>Industry<input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Technology" /></label>
          <label>Leads<select value={limit} onChange={e => setLimit(e.target.value)}><option value="5">5</option><option value="10">10</option><option value="25">25</option><option value="50">50</option></select></label>
          <button disabled={loading}>{loading ? 'Searching…' : 'Find leads →'}</button>
        </form>
        {error && <div className="error"><strong>Search needs attention</strong><span>{error}</span></div>}
        {warnings.length > 0 && <div className="warning">{warnings.join(' · ')}</div>}
      </section>

      <section className="results">
        <div className="resultsHead"><div><p className="eyebrow">PROSPECTS</p><h2>{visibleLeads.length ? `${visibleLeads.length} leads found` : 'Your leads will appear here'}</h2></div><div className="stats"><span><b>{visibleLeads.length}</b> FOUND</span><span><b>{visibleLeads.filter(l => (l.score || 0) >= 70).length}</b> HIGH SCORE</span></div></div>
        {visibleLeads.length > 0 ? <div className="grid">{visibleLeads.map((lead, i) => {
          const company = lead.business?.name || lead.company || lead.name || 'Unnamed business';
          const locationText = lead.business?.location || [lead.business?.city, lead.business?.country].filter(Boolean).join(', ') || location || 'Location pending';
          const website = lead.website || lead.business?.website;
          return <article className="lead" key={lead.id || `${company}-${i}`}><div className="leadTop"><div className="avatar">{company.slice(0, 1).toUpperCase()}</div><div><h3>{company}</h3><p>{lead.business?.industry || industry || 'B2B prospect'}</p></div><strong className="score">{lead.score ?? '—'}</strong></div><div className="meta"><span>{locationText}</span><span>{lead.email || lead.business?.email || 'Email not listed'}</span><span>{lead.phone || lead.business?.phone || 'Phone not listed'}</span></div>{website && <a href={website} target="_blank" rel="noreferrer">Visit website ↗</a>}</article>;
        })}</div> : <div className="empty"><div className="emptyIcon">⌕</div><h3>Start your first lead search</h3><p>You can search without signing in. Sign in when you want to use workspace/account features.</p></div>}
      </section>

      <footer>LeadPilot AI · real business discovery · evidence-aware scoring · Data source: OpenStreetMap</footer>
      <style jsx>{`
        :global(*){box-sizing:border-box} :global(body){margin:0;background:#07101b;color:#eaf2f8;font-family:Inter,system-ui,-apple-system,sans-serif}.shell{max-width:1180px;margin:auto;padding:24px 24px 60px}.topbar{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:8px 0 28px;border-bottom:1px solid #1b2a39}.topActions{display:flex;align-items:center;gap:18px}.brand{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:700}.brand b{color:#7ee7c4}.logo{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#123c3a;color:#7ee7c4;font-size:12px}.badge,.live{font-size:11px;letter-spacing:.12em;color:#8fa3b5}.hero{display:flex;justify-content:space-between;gap:30px;align-items:end;padding:70px 0 45px}.eyebrow{font-size:11px;letter-spacing:.16em;color:#6dd8b5;font-weight:700;margin:0 0 12px}.hero h1{font-size:clamp(42px,7vw,76px);line-height:.98;letter-spacing:-.05em;margin:0}.hero h1 span{color:#7ee7c4}.subtitle{font-size:18px;color:#9db0c0;max-width:570px;line-height:1.6}.heroCard{min-width:260px;padding:24px;border:1px solid #243646;border-radius:18px;background:#0c1824;display:flex;flex-direction:column;gap:8px}.heroCard span{color:#8da2b3;font-size:13px}.panel,.lead,.empty{background:#0b1723;border:1px solid #203243;border-radius:18px}.panel{padding:24px}.panelTitle,.resultsHead{display:flex;justify-content:space-between;align-items:center;gap:20px}.panel h2,.results h2{margin:0;font-size:24px}.panelTitle p{margin:5px 0 20px;color:#8195a7}.live{color:#7ee7c4}.live i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#7ee7c4;margin-right:6px}.form{display:grid;grid-template-columns:2fr 1.4fr 1.3fr .7fr auto;gap:12px;align-items:end}label{font-size:11px;color:#8fa3b5;display:flex;flex-direction:column;gap:7px}input,select{height:46px;border:1px solid #2a3d4f;border-radius:10px;background:#07111c;color:#eef5fa;padding:0 13px;font-size:14px;outline:none}button{height:46px;border:0;border-radius:10px;background:#7ee7c4;color:#06110f;font-weight:800;padding:0 20px;cursor:pointer}button:disabled{opacity:.6}.error,.warning{margin-top:15px;padding:14px;border-radius:10px;display:flex;gap:10px;flex-direction:column}.error{background:#2a161a;border:1px solid #71343d;color:#ffb8bd}.warning{background:#17251f;border:1px solid #315748;color:#a8dfcb}.results{padding-top:55px}.resultsHead{margin-bottom:20px}.stats{display:flex;gap:22px;color:#70879a;font-size:10px;letter-spacing:.1em}.stats b{display:block;color:#eaf2f8;font-size:22px;letter-spacing:0;margin-bottom:3px}.empty{min-height:280px;display:grid;place-items:center;text-align:center;padding:50px}.emptyIcon{font-size:48px;color:#557084}.empty h3{margin:0}.empty p{margin:0;color:#8095a7;max-width:500px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}.lead{padding:18px}.leadTop{display:flex;align-items:center;gap:12px}.avatar{width:42px;height:42px;border-radius:12px;background:#17323b;color:#7ee7c4;display:grid;place-items:center;font-weight:800}.lead h3{margin:0;font-size:16px}.lead p{margin:3px 0 0;color:#7f94a5;font-size:12px}.score{margin-left:auto;color:#7ee7c4;font-size:18px}.meta{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0 12px;color:#879bac;font-size:12px}.lead a{color:#7ee7c4;text-decoration:none;font-size:12px}.authWrap,.authSigned{display:flex;align-items:center;gap:8px}.authForm{display:flex;gap:6px}.authForm input{height:38px;width:190px}.authForm button,.authSigned button{height:38px;padding:0 12px;font-size:12px}.authSigned{font-size:11px;color:#a9bac7}.authMessage{position:absolute;margin-top:65px;right:24px;color:#7ee7c4;font-size:11px}.authMissing{font-size:10px;color:#ffb8bd;letter-spacing:.08em}footer{text-align:center;color:#5f7486;font-size:11px;margin-top:50px}@media(max-width:1000px){.badge{display:none}.form{grid-template-columns:1fr 1fr}.form button{grid-column:1/-1}}@media(max-width:850px){.hero{display:block;padding-top:45px}.heroCard{margin-top:25px}.grid{grid-template-columns:1fr}.topbar{align-items:flex-start}.topActions{flex-direction:column;align-items:flex-end}}@media(max-width:520px){.shell{padding:16px}.topbar{flex-direction:column}.topActions{width:100%;align-items:stretch}.authForm input{width:100%}.authForm{width:100%}.authForm button{flex:0 0 auto}.form{grid-template-columns:1fr}.stats{display:none}.panel{padding:16px}}
      `}</style>
    </main>
  );
}
