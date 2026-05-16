export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl flex-col justify-center">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-acc-4">TinyNotes</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
            Public authentication shell placeholder. No form handling or auth logic is wired yet.
          </p>
        </header>
        {children}
      </div>
    </main>
  );
}
