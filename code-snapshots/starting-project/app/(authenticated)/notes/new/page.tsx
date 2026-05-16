export default function NewNotePage() {
  return (
    <section className="rounded-lg border border-acc-2 bg-white/75 p-6 shadow-sm">
      <p className="text-sm font-medium text-acc-4">Authenticated route</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-acc-5">
        Dummy new note page
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
        Placeholder for the future note creation editor. No TipTap editor, note creation action, or
        autosave behavior has been implemented.
      </p>
      <div className="mt-8 min-h-56 rounded-lg border border-dashed border-acc-3 bg-acc-1/70 p-5 text-sm text-slate-700">
        Dummy editor surface
      </div>
    </section>
  );
}
