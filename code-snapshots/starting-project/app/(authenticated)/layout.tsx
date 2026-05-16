export default function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="border-b border-acc-2 bg-white/70 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6">
          <div>
            <p className="text-lg font-semibold tracking-tight text-acc-5">TinyNotes</p>
            <p className="text-sm text-slate-600">Authenticated shell placeholder</p>
          </div>
          <div className="rounded-full border border-acc-2 bg-acc-1 px-4 py-2 text-sm font-medium text-acc-5">
            Dummy user area
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </main>
  );
}
