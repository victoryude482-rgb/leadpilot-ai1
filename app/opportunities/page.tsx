'use client';

import { useEffect, useState } from 'react';

type Opportunity = { niche: string; score: number; signal: string; why: string; sourceCount: number };

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/opportunity-scout');
      if (!res.ok) throw new Error('Scout unavailable');
      const data = await res.json();
      setItems(data.opportunities ?? []);
    } catch { setError('The scout could not reach public trend sources. Try again.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div><p style={{ color: '#10b981', fontWeight: 700 }}>AI OPPORTUNITY SCOUT</p><h1>Find the niche before you find the leads.</h1><p>Public trend signals are scanned, grouped and ranked so you choose the market worth pursuing.</p></div>
        <button onClick={load} style={{ padding: '12px 18px', borderRadius: 10, border: 0, cursor: 'pointer' }}>Scan again</button>
      </div>
      {loading && <p>Scanning public trend signals…</p>}
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      <section style={{ display: 'grid', gap: 14, marginTop: 24 }}>
        {items.map((item, i) => (
          <article key={item.niche} style={{ border: '1px solid #ddd', borderRadius: 16, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div><strong>#{i + 1} {item.niche}</strong><p>{item.why}</p></div>
              <strong style={{ fontSize: 22 }}>{item.score}/100</strong>
            </div>
            <p style={{ fontSize: 14, opacity: .8 }}>{item.signal}</p>
            <a href={`/lead-finder?industry=${encodeURIComponent(item.niche)}`} style={{ display: 'inline-block', marginTop: 8, padding: '10px 14px', borderRadius: 9, background: '#10b981', color: '#06120f', textDecoration: 'none', fontWeight: 700 }}>Explore this niche →</a>
          </article>
        ))}
      </section>
    </main>
  );
}
