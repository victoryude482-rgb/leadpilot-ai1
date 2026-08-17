'use client';

import { FormEvent, useState } from 'react';
import { searchLeadFinder, searchTrendLeads } from '../../src/api/lead-finder-client';
import LeadQualityBadge from '../../components/lead-quality-badge';

type Lead = {
  lead?: { id?: string; score?: number; scoreLabel?: string; status?: string };
  business?: { name?: string; website?: string; phone?: string; email?: string; city?: string; country?: string; industry?: string };
  report?: { confidence?: number; level?: string; recommendation?: string };
};

type Trend = { title: string; source: string; url?: string; community?: string; relevance: number };
type SearchResult = { results?: Lead[]; count?: number; warnings?: string[]; error?: string; trends?: Trend[]; strategy?: string[] };

export default function LeadFinderPage() {
  const [filters, setFilters] = useState({ industry: '', country: '', city: '', keywords: '', limit: 25 });
  const [trendMode, setTrendMode] = useState(false);
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<SearchResult>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState('loading');
    try {
      const body = trendMode ? await searchTrendLeads(filters) : await searchLeadFinder(filters);
      setResult(body as SearchResult);
      setState('done');
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Search failed' });
      setState('error');
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 32, fontFamily: 'system-ui' }}>
      <h1>Lead Finder</h1>
      <p>Search prospects directly, or let current Reddit/news signals guide the niche before finding real businesses.</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        {(['industry', 'country', 'city', 'keywords'] as const).map((key) => (
          <input key={key} value={filters[key]} placeholder={key} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })} />
        ))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={trendMode} onChange={(e) => setTrendMode(e.target.checked)} />
          Trend-first search (Reddit + News → business discovery)
        </label>
        <button disabled={state === 'loading'} type="submit">{state === 'loading' ? 'Finding leads…' : trendMode ? 'Find trending opportunities' : 'Find leads'}</button>
      </form>

      {result.error && <p role="alert">{result.error}</p>}
      {state === 'done' && <p>{result.count ?? result.results?.length ?? 0} leads found.</p>}

      {trendMode && result.trends?.length ? (
        <section style={{ marginTop: 20, padding: 16, border: '1px solid #ddd', borderRadius: 12 }}>
          <h2>Trending signals</h2>
          {result.trends.map((trend, index) => (
            <div key={`${trend.source}-${index}`} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <strong>{trend.title}</strong>
              <div style={{ fontSize: 13, opacity: 0.75 }}>{trend.source}{trend.community ? ` · ${trend.community}` : ''} · relevance {trend.relevance}/100</div>
              {trend.url && <a href={trend.url} target="_blank" rel="noreferrer">View signal</a>}
            </div>
          ))}
        </section>
      ) : null}

      <section style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        {(result.results ?? []).map((item, index) => (
          <article key={item.lead?.id ?? index} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <h2>{item.business?.name ?? 'Unknown business'}</h2>
              <LeadQualityBadge score={item.lead?.score} />
            </div>
            <p>{item.business?.industry ?? 'Industry unknown'} · {item.business?.city ?? ''} {item.business?.country ?? ''}</p>
            <p>Score: <strong>{item.lead?.score ?? 0}</strong> ({item.lead?.scoreLabel ?? 'UNRATED'})</p>
            <p>Reliability: {item.report?.level ?? 'Pending'} {item.report?.confidence != null ? `(${item.report.confidence}%)` : ''}</p>
            <p>Recommendation: {item.report?.recommendation ?? 'Review'}</p>
            {item.business?.website && <a href={item.business.website} target="_blank" rel="noreferrer">Website</a>}
          </article>
        ))}
      </section>
      {result.strategy?.length ? <p>Strategy: {result.strategy.join(' · ')}</p> : null}
      {result.warnings?.length ? <p>Provider warnings: {result.warnings.join(' · ')}</p> : null}
    </main>
  );
}
