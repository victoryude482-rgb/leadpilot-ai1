'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/src/auth/supabase-browser';

const agents = [
  ['lead-finder','AI Lead Finder','Find, verify, score and rank real businesses from multiple sources.','research'],
  ['trend-finder','AI Trend Finder','Discover emerging topics, markets, products and business signals.','research'],
  ['opportunity-finder','AI Opportunity Finder','Turn demand signals into actionable business opportunities.','research'],
  ['tender-finder','AI Tender Finder','Find public tenders, contracts and procurement opportunities.','research'],
  ['competitor-monitor','AI Competitor Monitor','Monitor public competitor changes and useful alerts.','monitoring'],
  ['outreach','AI Outreach Agent','Create personalized, approval-first outreach drafts.','sales'],
  ['ecommerce-opportunity','AI E-commerce Opportunity','Identify product and market opportunities.','research'],
  ['content','AI Business Content Agent','Create practical business content and campaign ideas.','content'],
  ['command-agent','AI Command Agent','Give one plain-language command and let agents coordinate.','orchestration'],
  ['workpilot','WorkPilot AI','Find jobs across Indeed, Upwork, Freelancer and Fiverr, solve the client problem and draft proposals.','work'],
  ['website-brand','AI Website & Brand Agent','Create human-style website structures, brand concepts and logo assets.','build'],
];

const tools = [
  { href:'/lead-finder', title:'Lead Finder', text:'Search anything with trend-first discovery, evidence and lead scoring.' },
  { href:'/opportunities', title:'Opportunities', text:'See market gaps and demand signals.' },
  { href:'/pipeline', title:'Pipeline', text:'Manage leads through your sales workflow.' },
  { href:'/revenue', title:'Revenue', text:'Track revenue attribution and performance.' },
  { href:'/offer', title:'Offers', text:'Turn verified opportunities into approval-ready offers.' },
];

export default function WorkspacePage() {
  const [email, setEmail] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) { setChecking(false); return; }
    client.auth.getSession().then(({ data }) => {
      if (!data.session) { window.location.href = '/'; return; }
      setEmail(data.session.user.email || '');
      setChecking(false);
    });
  }, []);

  if (checking) return <main className="loading">Opening LeadPilot workspace…</main>;

  return <main className="workspace">
    <header>
      <div>
        <p className="eyebrow">LEADPILOT AI · VICTORY'S WORKSPACE</p>
        <h1>Your AI business workspace.</h1>
        <p className="sub">{email} · All available agents and business tools in one place.</p>
      </div>
      <div className="actions"><a className="primary" href="/?agent=command-agent">Open Command Center →</a><a className="secondary" href="/lead-finder">Search leads</a></div>
    </header>

    <section className="status"><div><strong>Multi-agent system ready</strong><span>Discover → research → score → solve → build → communicate → act</span></div><span className="live">● AUTHENTICATED</span></section>

    <section><div className="sectionHead"><div><p className="eyebrow">AI AGENTS</p><h2>Everything you can use</h2></div><a href="/?agent=command-agent">Command Center →</a></div>
      <div className="agentGrid">{agents.map(([id,title,text,category]) => <a className="agent" href={`/?agent=${id}`} key={id}><div className="agentTop"><span className="dot"/><span>{category}</span><b>↗</b></div><h3>{title}</h3><p>{text}</p><span className="open">Open agent →</span></a>)}</div>
    </section>

    <section className="tools"><div className="sectionHead"><div><p className="eyebrow">WORKSPACE TOOLS</p><h2>Business operations</h2></div></div><div className="toolGrid">{tools.map(tool => <a className="tool" href={tool.href} key={tool.href}><h3>{tool.title}</h3><p>{tool.text}</p><span>Open →</span></a>)}</div></section>

    <section className="flow"><p className="eyebrow">HOW LEADPILOT WORKS</p><div className="flowGrid"><div><b>01</b><strong>Discover</strong><span>Leads, trends, jobs and opportunities.</span></div><div><b>02</b><strong>Understand</strong><span>Research evidence and identify the real problem.</span></div><div><b>03</b><strong>Build</strong><span>Offers, proposals, websites and content.</span></div><div><b>04</b><strong>Act</strong><span>Approval-first outreach and client communication.</span></div></div></section>

    <footer>LeadPilot AI · evidence-aware multi-agent business intelligence · human approval stays in control</footer>
    <style jsx>{`
      :global(body){margin:0;background:#07101b;color:#eaf2f8;font-family:Inter,system-ui,sans-serif}.workspace{max-width:1220px;margin:auto;padding:30px 24px 60px}
      header{display:flex;justify-content:space-between;gap:30px;align-items:flex-end;padding:12px 0 34px;border-bottom:1px solid #1b2a39}.eyebrow{margin:0 0 10px;color:#6dd8b5;font-size:10px;font-weight:800;letter-spacing:.16em}.sub{color:#9db0c0;font-size:15px}h1{margin:0;max-width:850px;font-size:clamp(42px,7vw,76px);line-height:.96;letter-spacing:-.05em}h2{margin:0;font-size:30px;letter-spacing:-.03em}.actions{display:flex;gap:8px;flex-wrap:wrap}.actions a{padding:11px 14px;border-radius:10px;text-decoration:none;font-size:12px;font-weight:800}.primary{background:#74dfbd;color:#06140f}.secondary{border:1px solid #2b4557;color:#a9e7d6}
      .status{margin:26px 0 45px;padding:20px;border:1px solid #243646;border-radius:16px;background:#0c1824;display:flex;justify-content:space-between;align-items:center;gap:20px}.status div{display:flex;flex-direction:column;gap:6px}.status span{color:#8da2b3;font-size:12px}.status .live{color:#74dfbd;font-weight:800;font-size:10px}
      .sectionHead{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:18px}.sectionHead>a{color:#74dfbd;text-decoration:none;font-size:12px;font-weight:800}.agentGrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}.agent{min-height:190px;padding:20px;border:1px solid #243646;border-radius:17px;background:#0c1824;text-decoration:none;color:#eaf2f8;transition:.15s}.agent:hover,.tool:hover{transform:translateY(-2px);border-color:#74dfbd}.agentTop{display:flex;align-items:center;gap:8px;color:#6f8798;font-size:9px;text-transform:uppercase;letter-spacing:.12em}.agentTop b{margin-left:auto;color:#74dfbd;font-size:18px}.dot{width:7px;height:7px;border-radius:50%;background:#74dfbd}.agent h3{margin:24px 0 9px;font-size:19px}.agent p,.tool p{color:#9db0c0;line-height:1.5;font-size:13px;margin:0 0 20px}.open,.tool span{color:#74dfbd;font-size:11px;font-weight:800}.tools{margin-top:48px}.toolGrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}.tool{padding:18px;border:1px solid #243646;border-radius:15px;background:#0c1824;text-decoration:none;color:#eaf2f8;transition:.15s}.tool h3{margin:0 0 9px;font-size:16px}.flow{margin-top:48px;padding:24px;border:1px solid #243646;border-radius:18px;background:#091622}.flowGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}.flowGrid div{display:flex;flex-direction:column;gap:6px}.flowGrid b{color:#527286;font-size:10px}.flowGrid strong{font-size:18px}.flowGrid span{color:#8da2b3;font-size:12px;line-height:1.4}footer{margin-top:48px;color:#64798a;font-size:10px}.loading{min-height:100vh;display:grid;place-items:center;background:#07101b;color:#74dfbd}
      @media(max-width:900px){.agentGrid{grid-template-columns:repeat(2,1fr)}.toolGrid{grid-template-columns:repeat(2,1fr)}.flowGrid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.workspace{padding:20px 14px 45px}header{display:block}.actions{margin-top:18px}.status{display:block}.status .live{display:block;margin-top:12px}.agentGrid,.toolGrid,.flowGrid{grid-template-columns:1fr}h1{font-size:46px}.sectionHead{align-items:start}}
    `}</style>
  </main>;
}
