"use client";

export default function NotesError({
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <section className="rounded-lg border border-acc-2 bg-acc-1/80 p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-widest text-acc-4">Notes error</p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-acc-5">
        The notes workspace could not load
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/75">
        Try loading the workspace again. If this keeps happening, check the server logs for details.
      </p>
      <button
        className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md bg-acc-3 px-4 py-2 text-sm font-semibold text-background shadow-sm transition hover:bg-acc-4 focus:outline-none focus:ring-2 focus:ring-acc-4 focus:ring-offset-2 focus:ring-offset-background"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </section>
  );
}
