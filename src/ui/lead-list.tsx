import type { LeadRecord } from '../leads/model';

export function LeadList({ leads }: { leads: LeadRecord[] }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-800 text-slate-400">
            <tr><th className="p-4">Lead</th><th className="p-4">Score</th><th className="p-4">Status</th></tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-slate-800 last:border-0">
                <td className="p-4 font-medium">{lead.businessId}</td>
                <td className="p-4">{lead.score}/100 · {lead.scoreLabel}</td>
                <td className="p-4">{lead.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
