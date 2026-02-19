"use client";

import { useEffect } from "react";

type NotesErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function NotesError({ error, reset }: NotesErrorProps) {
  useEffect(() => {
    console.error("Notes route failed", error);
  }, [error]);

  return (
    <section className="rounded-xl border border-red-300/25 bg-red-400/10 p-5">
      <h2 className="text-lg font-semibold text-red-100">Unable to load notes</h2>
      <p className="mt-2 text-sm text-red-200/90">
        Something went wrong while loading this notes screen.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg border border-red-200/35 px-4 py-2 text-sm font-semibold text-red-100 transition-colors hover:bg-red-300/10"
      >
        Try again
      </button>
    </section>
  );
}
