'use client';

import { FormEvent, useState } from 'react';
import { searchLeadFinder } from '../../src/api/lead-finder-client';

type Lead = {
  lead?: { id?: string; score?: number; scoreLabel?: string; status?: string };
  business?: { name?: string; website?: string; phone?: string; email?: string; city?: string; country?: string; industry?: string };
  report?: { confidence?: number; level?: string; recommendation?: string };
};

export default function LeadFinderPage() {
  const [filters, setFilters] = useState({ industry: '', country: '', city: '', keywords: '', limit: 25 });
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ results?: Lead[]; count?: number; warnings?: string[]; error?: string }>({});

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState('loading');
    try {
      setResult((await searchLeadFinder(filters)) as typeof result);
      setState('done');
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Search failed' });
      setState('error');
    }
  }

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: 32, fontFamily: 'system-ui' }}>
      <h1>Lead Finder</h1>
      <p>Search for prospects, then review verification and reliability before outreach.</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 24 }}>
        {(['industry', 'country', 'city', 'keywords'] as const).map((key) => (
          <input key={key} value={filters[key]} placeholder={key} onChange={(e) => setFilters({ ...filters, [key]: e.target.value })} />
        ))}
        <button disabled={state === 'loading'} type="submit">{state === 'loading' ? 'Finding leads…' : 'Find leads'}</button>
      </form>

      {result.error && <p role="alert">{result.error}</p>}
      {state === 'done' && <p>{result.count ?? 0} leads found.</p>}
      <section style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        {(result.results ?? []).map((item, index) => (
          <article key={item.lead?.id ?? index} style={{ border: '1px solid #ddd', borderRadius: 12, padding: 16 }}>
            <h2>{item.business?.name ?? 'Unknown business'}</h2>
            <p>{item.business?.industry ?? 'Industry unknown'} · {item.business?.city ?? ''} {item.business?.country ?? ''}</p>
            <p>Score: <strong>{item.lead?.score ?? 0}</strong> ({item.lead?.scoreLabel ?? 'UNRATED'})</p>
            <p>Reliability: {item.report?.level ?? 'Pending'} {item.report?.confidence != null ? `(${item.report.confidence}%)` : ''}</p>
            <p>Recommendation: {item.report?.recommendation ?? 'Review'}</p>
            {item.business?.website && <a href={item.business.website} target="_blank" rel="noreferrer">Website</a>}
          </article>
        ))}
      </section>
      {result.warnings?.length ? <p>Provider warnings: {result.warnings.join(' · ')}</p> : null}
    </main>
  );
}
