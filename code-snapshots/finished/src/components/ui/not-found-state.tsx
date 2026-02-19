import Link from "next/link";
import { AreaShell } from "@/src/components/layout/area-shell";

export function NotFoundState() {
  return (
    <AreaShell className="bg-(--surface-soft)">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-(--foreground-muted)">
        404
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-(--foreground)">
        404 - Resource Not Found
      </h1>
      <p className="mt-3 text-(--foreground-muted)">
        The requested page or resource does not exist.
      </p>
      <p className="mt-2 text-sm text-(--foreground-muted)">
        The link may be incorrect, the note might have been deleted, or a shared link could have
        been disabled.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-lg border border-(--border) px-4 py-2 text-sm font-medium text-(--foreground-muted) transition-colors hover:border-(--accent) hover:text-(--accent)"
        >
          Go home
        </Link>
        <Link
          href="/notes"
          className="rounded-lg bg-(--accent) px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-(--accent-strong)"
        >
          Open notes
        </Link>
      </div>
    </AreaShell>
  );
}
