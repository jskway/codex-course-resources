export default function NotesPage() {
  return (
    <div className="grid gap-4">
      <section className="rounded-lg border border-acc-2 bg-white/75 p-6 shadow-sm">
        <p className="text-sm font-medium text-acc-4">Authenticated route</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-acc-5">
          Dummy notes list
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
          Placeholder for the future list of notes sorted by last update. No session check or
          database read has been implemented.
        </p>
      </section>
      <section className="rounded-lg border border-dashed border-acc-3 bg-acc-1/70 p-6">
        <p className="text-sm font-medium text-acc-5">Dummy empty state</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          This area will eventually show either note rows or an empty list state.
        </p>
      </section>
    </div>
  );
}
