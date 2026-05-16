export default async function NoteDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const { id } = await params;

  return (
    <section className="rounded-lg border border-acc-2 bg-white/75 p-6 shadow-sm">
      <p className="text-sm font-medium text-acc-4">Authenticated route</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-acc-5">
        Dummy note detail page
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
        Placeholder for the future note editor and share controls. No ownership check, note fetch,
        editor logic, or sharing behavior has been implemented.
      </p>
      <div className="mt-6 rounded-lg border border-acc-2 bg-acc-1/70 p-4 text-sm text-acc-5">
        Dummy route parameter: {id}
      </div>
      <div className="mt-8 min-h-56 rounded-lg border border-dashed border-acc-3 bg-white/70 p-5 text-sm text-slate-700">
        Dummy editor and share controls surface
      </div>
    </section>
  );
}
