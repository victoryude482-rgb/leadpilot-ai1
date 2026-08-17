import type { ReliableLeadReport } from '../leads/reliable-report';
import type { LeadRecord } from '../leads/model';
import type { LeadResearch } from '../agents/lead-research-agent';
import LeadQualityBadge from '../../components/lead-quality-badge';

export function ReliableLeadCard({ lead, report, research }: { lead: LeadRecord; report: ReliableLeadReport; research?: LeadResearch }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Lead</p>
          <h2 className="text-lg font-semibold">{lead.businessId}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <LeadQualityBadge score={lead.score} />
            <span className="text-xs text-slate-400">Lead score: {lead.score}/100 · {lead.scoreLabel}</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 px-3 py-2 text-right">
          <p className="text-xs text-slate-400">Reliability</p>
          <p className="font-semibold">{report.reliability.confidence}% · {report.recommendation}</p>
        </div>
      </div>

      {research && (
        <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Why AI thinks this is a lead</h3>
            <span className="text-xs text-slate-400">Research-backed signals</span>
          </div>
          <p className="mt-2 text-sm text-slate-300">{research.summary}</p>
          {research.signals.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {research.signals.map((signal) => <span key={signal} className="rounded-full border border-slate-700 px-2 py-1 text-xs text-slate-300">✓ {signal}</span>)}
            </div>
          )}
          <div className="mt-3 rounded-lg bg-slate-900 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Recommended offer</p>
            <p className="mt-1 text-sm font-medium text-white">{research.recommendedOffer}</p>
          </div>
          {research.missing.length > 0 && <p className="mt-3 text-xs text-slate-500">Missing evidence: {research.missing.join(', ')}</p>}
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {report.reliability.checks.map((check) => (
          <div key={check.name} className="rounded-lg bg-slate-950 p-3 text-sm">
            <div className="flex justify-between gap-3"><span>{check.name}</span><span>{check.status}</span></div>
            <p className="mt-1 text-xs text-slate-400">{check.detail}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-300">Website: {report.website.status}</p>
    </article>
  );
}
