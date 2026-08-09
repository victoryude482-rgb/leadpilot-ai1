export interface LeadFinderFilters {
  industry: string;
  country: string;
  city: string;
  keywords: string;
  minimumScore: number;
}

export function LeadFinder({ onSearch }: { onSearch: (filters: LeadFinderFilters) => void }) {
  return (
    <form
      className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSearch({
          industry: String(form.get('industry') ?? ''),
          country: String(form.get('country') ?? ''),
          city: String(form.get('city') ?? ''),
          keywords: String(form.get('keywords') ?? ''),
          minimumScore: Number(form.get('minimumScore') ?? 0),
        });
      }}
    >
      {['industry', 'country', 'city', 'keywords'].map((name) => (
        <label key={name} className="grid gap-2 text-sm text-slate-300">
          {name[0].toUpperCase() + name.slice(1)}
          <input name={name} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        </label>
      ))}
      <label className="grid gap-2 text-sm text-slate-300">
        Minimum score
        <input name="minimumScore" type="number" min="0" max="100" defaultValue="70" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
      </label>
      <button className="rounded-xl bg-white px-4 py-2 font-semibold text-slate-950" type="submit">
        Find prospects
      </button>
    </form>
  );
}
