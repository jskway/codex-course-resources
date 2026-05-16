export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto flex min-h-[70vh] max-w-4xl flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-acc-4">TinyNotes</p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-acc-5 sm:text-6xl">
          Dummy root page
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
          Future behavior: redirect authenticated users to notes and unauthenticated users to login.
          This placeholder intentionally contains no authentication or redirect logic.
        </p>
        <div className="mt-10 flex flex-wrap gap-3 text-sm font-medium text-acc-5">
          <span className="rounded-full border border-acc-2 bg-acc-1 px-4 py-2">/login</span>
          <span className="rounded-full border border-acc-2 bg-acc-1 px-4 py-2">/register</span>
          <span className="rounded-full border border-acc-2 bg-acc-1 px-4 py-2">/notes</span>
        </div>
      </section>
    </main>
  );
}
