export default function SharedLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 border-b border-acc-2 pb-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-acc-4">TinyNotes</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-acc-5">Shared note</h1>
        </header>
        {children}
      </div>
    </main>
  );
}
