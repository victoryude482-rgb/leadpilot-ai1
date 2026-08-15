'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/src/auth/supabase-browser';

const features = [
  { href: '/', title: 'AI Command Center', text: 'Tell Victory AI what you want done and let the agents plan the work.' },
  { href: '/lead-finder', title: 'Lead Finder', text: 'Find, verify, score and inspect real business leads.' },
  { href: '/opportunities', title: 'Opportunity Finder', text: 'Discover market gaps, demand signals and business opportunities.' },
  { href: '/pipeline', title: 'Pipeline', text: 'Track discovered leads and move them through your sales workflow.' },
  { href: '/revenue', title: 'Revenue', text: 'Monitor revenue attribution and business performance.' },
  { href: '/offer', title: 'Offers', text: 'Create and manage approval-first offers from verified evidence.' },
];

export default function WorkspacePage() {
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) { setChecking(false); return; }
    client.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.href = '/';
        return;
      }
      setEmail(data.session.user.email || '');
      setChecking(false);
    });
  }, []);

  if (checking) return <main className="loading">Opening Victory's workspace…</main>;

  return <main className="workspace">
    <header>
      <div>
        <p className="eyebrow">VICTORY'S WORKSPACE</p>
        <h1>Welcome back.</h1>
        <p className="sub">{email} · Your AI agents are ready.</p>
      </div>
      <a className="back" href="/">AI Command Center →</a>
    </header>

    <section className="status">
      <div><strong>All systems in one place</strong><span>Research → verify → score → monitor → act</span></div>
      <span className="live">● AUTHENTICATED</span>
    </section>

    <section>
      <p className="eyebrow">YOUR FEATURES</p>
      <div className="grid">{features.map(feature => <a className="card" href={feature.href} key={feature.href}>
        <div className="arrow">↗</div>
        <h2>{feature.title}</h2>
        <p>{feature.text}</p>
        <span>Open feature →</span>
      </a>)}</div>
    </section>

    <footer>Victory AI · authenticated workspace · evidence-aware business intelligence</footer>

    <style jsx>{`
      :global(body){margin:0;background:#07101b;color:#eaf2f8;font-family:Inter,system-ui,sans-serif}
      .workspace{max-width:1180px;margin:auto;padding:34px 24px 60px}
      header{display:flex;justify-content:space-between;gap:30px;align-items:flex-end;padding:15px 0 35px;border-bottom:1px solid #1b2a39}
      .eyebrow{margin:0 0 10px;color:#6dd8b5;font-size:11px;font-weight:800;letter-spacing:.16em}
      h1{margin:0;font-size:clamp(42px,7vw,76px);letter-spacing:-.05em;line-height:.95}
      .sub{color:#9db0c0;font-size:16px}
      .back{color:#74dfbd;text-decoration:none;border:1px solid #2b4557;border-radius:10px;padding:12px 15px;white-space:nowrap}
      .status{margin:28px 0 42px;padding:20px;border:1px solid #243646;border-radius:16px;background:#0c1824;display:flex;justify-content:space-between;gap:20px;align-items:center}
      .status div{display:flex;flex-direction:column;gap:6px}.status span{color:#8da2b3;font-size:12px}.status .live{color:#74dfbd;font-weight:800;font-size:11px}
      .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
      .card{position:relative;min-height:190px;padding:24px;border:1px solid #243646;border-radius:18px;background:#0c1824;text-decoration:none;color:#eaf2f8;transition:transform .15s,border-color .15s}
      .card:hover{transform:translateY(-2px);border-color:#74dfbd}.card h2{margin:25px 0 10px;font-size:22px}.card p{margin:0 0 22px;color:#9db0c0;line-height:1.55}.card span{color:#74dfbd;font-size:12px;font-weight:700}.arrow{position:absolute;right:18px;top:16px;color:#74dfbd;font-size:20px}
      footer{margin-top:55px;color:#64798a;font-size:11px}
      .loading{min-height:100vh;display:grid;place-items:center;background:#07101b;color:#74dfbd;font-family:Inter,system-ui,sans-serif}
      @media(max-width:760px){.workspace{padding:22px 16px 50px}header{display:block}.back{display:inline-block;margin-top:15px}.grid{grid-template-columns:1fr}.status{display:block}.status .live{display:block;margin-top:12px}}
    `}</style>
  </main>;
}
