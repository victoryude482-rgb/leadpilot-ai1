'use client';

import { FormEvent, useState } from 'react';
import { searchLeadFinder } from '../../src/api/lead-finder-client';

export default function LeadFinderPage() {
  const [filters, setFilters] = useState({ industry: '', country: '', city: '', keywords: '', limit: 25 });
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<unknown>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setState('loading');
    try {
      setResult(await searchLeadFinder(filters));
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
      {state !== 'idle' && <pre style={{ marginTop: 24, whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}
