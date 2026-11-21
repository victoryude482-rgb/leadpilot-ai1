'use client';
import { useState, useEffect } from 'react';

export type AgentCard = { id: string; name: string; description: string; category: string; status: string; capabilities: string[] };

export function AgentRunner() {
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [agentId, setAgentId] = useState('');
  const [query, setQuery] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => setAgents(Array.isArray(data.agents) ? data.agents : []))
      .catch(() => setAgents([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: agentId, query }),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || `Request failed (${response.status})`);
      } else {
        setResult(body);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Agent run failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="panel" style={{ marginTop: '24px' }}>
      <p className="eyebrow">RUN AN AGENT</p>
      <h2>Ask a specialist agent</h2>
      <p style={{ color: '#91a5b5', fontSize: '12px', marginBottom: '14px' }}>
        Pick a specialist and describe what you need. Results come from live discovery sources; nothing is invented.
      </p>
      <form onSubmit={handleSubmit} className="taskForm" style={{ display: 'grid', gap: '10px', maxWidth: '620px' }}>
        <select
          name="agent"
          value={agentId}
          onChange={(e) => setAgentId(e.target.value)}
          required
          style={{ padding: '12px', border: '1px solid #2a4052', borderRadius: '8px', background: '#07111c', color: 'white' }}
        >
          <option value="">Choose an agent</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} — {a.description}
            </option>
          ))}
        </select>
        <textarea
          name="query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Example: find coffee shops in Austin, Texas"
          minLength={3}
          required
          rows={3}
          style={{ padding: '12px', border: '1px solid #2a4052', borderRadius: '8px', background: '#07111c', color: 'white' }}
        />
        {error && <small style={{ color: '#ffb5b5' }}>{error}</small>}
        <button type="submit" disabled={running} style={{ border: '0', borderRadius: '8px', background: running ? '#4a5a6a' : '#74dfbd', padding: '12px 16px', fontWeight: '800', fontSize: '13px', cursor: running ? 'not-allowed' : 'pointer' }}>
          {running ? 'Running…' : 'Run agent'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: '16px', padding: '14px', background: '#0b151f', border: '1px solid #243849', borderRadius: '10px', maxWidth: '620px' }}>
          <p style={{ color: '#74dfbd', fontSize: '10px', letterSpacing: '.16em', fontWeight: '800', margin: '0 0 8px' }}>RESULT</p>
          <pre style={{ color: '#eaf2f8', fontSize: '12px', lineHeight: '1.5', overflow: 'auto', whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </section>
  );
}
