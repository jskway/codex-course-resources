export default function NotFound() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-acc-4">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-acc-5">
          Dummy not found page
        </h1>
        <p className="mt-6 max-w-xl text-base leading-7 text-slate-700">
          Placeholder for missing pages and resources. Future shared-note failures and missing note
          resources can resolve here.
        </p>
      </section>
    </main>
  );
}
