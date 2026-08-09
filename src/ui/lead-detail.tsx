import type { LeadRecord } from '../leads/model';
import type { ScoreFactor } from '../leads/scoring';
import type { VerificationCheck } from '../leads/verification';

export interface LeadDetailProps {
  lead: LeadRecord;
  factors: ScoreFactor[];
  verification: VerificationCheck[];
  memories: Array<{ type: string; content: string; source?: string }>;
  activities: Array<{ type: string; description: string; createdAt: string }>;
  outreachDraft?: string;
}

export function LeadDetail({ lead, factors, verification, memories, activities, outreachDraft }: LeadDetailProps) {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-slate-400">Lead profile</p>
          <h1 className="text-2xl font-bold">{lead.businessId}</h1>
          <p className="mt-2 text-slate-300">{lead.score}/100 · {lead.scoreLabel} · {lead.status}</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Verification evidence</h2>
            <div className="mt-4 space-y-3">
              {verification.map((check) => (
                <div key={check.type} className="rounded-xl bg-slate-950 p-3">
                  <div className="flex justify-between gap-4"><span>{check.type}</span><span>{check.status}</span></div>
                  <p className="mt-1 text-sm text-slate-400">{check.evidence}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Score breakdown</h2>
            <div className="mt-4 space-y-3">
              {factors.map((factor) => (
                <div key={factor.factor} className="flex justify-between gap-4 border-b border-slate-800 pb-3">
                  <div><p>{factor.factor}</p><p className="text-sm text-slate-400">{factor.explanation}</p></div>
                  <span>+{factor.points}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Shared memory</h2>
            <div className="mt-4 space-y-3">{memories.map((m, i) => <div key={i} className="text-sm"><b>{m.type}</b><p className="text-slate-400">{m.content}</p></div>)}</div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Activity</h2>
            <div className="mt-4 space-y-3">{activities.map((a, i) => <div key={i} className="text-sm"><b>{a.type}</b><p className="text-slate-400">{a.description}</p></div>)}</div>
          </article>
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <h2 className="font-semibold">Outreach draft</h2>
            <p className="mt-4 whitespace-pre-wrap text-sm text-slate-300">{outreachDraft ?? 'No draft generated yet.'}</p>
            <button className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950">Generate pitch</button>
          </article>
        </section>
      </div>
    </main>
  );
}
