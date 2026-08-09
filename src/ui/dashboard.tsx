export interface DashboardCard {
  label: string;
  value: number;
}

export function Dashboard({ cards }: { cards: DashboardCard[] }) {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm text-slate-400">LeadPilot AI</p>
          <h1 className="text-3xl font-bold">Sales Command Center</h1>
          <p className="mt-2 text-slate-400">Find, verify, prioritize and convert better prospects.</p>
        </header>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <article key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold">{card.value}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
