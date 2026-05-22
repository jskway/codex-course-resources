export default function NotesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <section>
      <header className="mb-8 flex flex-col gap-4 border-b border-acc-2 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-acc-4">Notes</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-acc-5">
            Dummy notes workspace
          </h1>
        </div>
        <div className="rounded-full border border-acc-2 bg-acc-1/80 px-4 py-2 text-sm font-medium text-acc-5">
          New note placeholder
        </div>
      </header>
      {children}
    </section>
  );
}
