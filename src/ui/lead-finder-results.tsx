import type { LeadRecord } from '../leads/model';
import type { ReliableLeadReport } from '../leads/reliable-report';
import type { LeadResearch } from '../agents/lead-research-agent';
import { ReliableLeadCard } from './reliable-lead-card';

export interface LeadFinderResult {
  lead: LeadRecord;
  report: ReliableLeadReport;
  research?: LeadResearch;
}

export function LeadFinderResults({ results }: { results: LeadFinderResult[] }) {
  if (!results.length) {
    return <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No prospects matched your filters.</div>;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Prospects worth reviewing</h2>
        <span className="text-sm text-slate-400">{results.length} results</span>
      </div>
      {results.map(({ lead, report, research }) => (
        <ReliableLeadCard key={lead.id} lead={lead} report={report} research={research} />
      ))}
    </section>
  );
}
