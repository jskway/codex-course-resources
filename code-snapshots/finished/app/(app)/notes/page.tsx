import Link from "next/link";
import { NotesList } from "@/src/components/notes/notes-list";
import { listNotesByUser } from "@/src/lib/notes/repository";
import { requireSessionOrRedirect } from "@/src/lib/session";

export default async function NotesListPage() {
  const session = await requireSessionOrRedirect();
  const userId = session.user.id;
  const notes = listNotesByUser(userId);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-(--foreground)">Your notes</h1>
          <p className="mt-1 text-sm text-(--foreground-muted)">
            Select a note to continue editing or create a new one.
          </p>
        </div>
        <Link
          href="/notes/new"
          className="rounded-lg bg-(--accent) px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-(--accent-strong)"
        >
          New note
        </Link>
      </header>

      <NotesList notes={notes} />
    </section>
  );
}
