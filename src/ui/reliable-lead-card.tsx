import type { ReliableLeadReport } from '../leads/reliable-report';
import type { LeadRecord } from '../leads/model';

export function ReliableLeadCard({ lead, report }: { lead: LeadRecord; report: ReliableLeadReport }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Lead</p>
          <h2 className="text-lg font-semibold">{lead.businessId}</h2>
        </div>
        <div className="rounded-xl border border-slate-700 px-3 py-2 text-right">
          <p className="text-xs text-slate-400">Reliability</p>
          <p className="font-semibold">{report.reliability.confidence}% · {report.recommendation}</p>
        </div>
      </div>
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
