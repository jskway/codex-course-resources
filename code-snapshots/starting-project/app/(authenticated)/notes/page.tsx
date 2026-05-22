import Link from "next/link";
import { getNoteDisplayTitle } from "@/lib/note-content";
import { listNotesForUser } from "@/lib/notes";
import { requireSession } from "@/lib/session";

export default async function NotesPage() {
  const session = await requireSession();
  const notes = listNotesForUser(session.user.id);

  if (notes.length === 0) {
    return (
      <section>
        <NotesPageHeader />
        <div className="rounded-lg border border-dashed border-acc-3 bg-acc-1/70 p-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-acc-4">No notes yet</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-acc-5">
            Start with a blank note
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/75">
            Create your first rich text note and it will appear here, sorted by the latest update.
          </p>
          <Link
            className="mt-6 inline-flex min-h-10 items-center justify-center rounded-md bg-acc-3 px-4 py-2 text-sm font-semibold text-background shadow-sm transition hover:bg-acc-4 focus:outline-none focus:ring-2 focus:ring-acc-4 focus:ring-offset-2 focus:ring-offset-background"
            href="/notes/new"
          >
            Create note
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <NotesPageHeader />
      <ol className="grid gap-3">
        {notes.map((note) => (
          <li key={note.id}>
            <Link
              className="group block rounded-lg border border-acc-2 bg-acc-1/75 p-5 shadow-sm transition hover:border-acc-3 hover:bg-acc-1 focus:outline-none focus:ring-2 focus:ring-acc-3 focus:ring-offset-2 focus:ring-offset-background"
              href={`/notes/${note.id}`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-acc-5 transition group-hover:text-acc-4">
                    {getNoteDisplayTitle(note.title)}
                  </h2>
                  <p className="mt-2 text-sm text-foreground/65">
                    Created {formatNoteDate(note.createdAt)}
                  </p>
                </div>
                <p className="text-sm font-medium text-acc-4">
                  Updated {formatNoteDate(note.updatedAt)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function NotesPageHeader() {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-acc-2 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-acc-4">Notes</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-acc-5">Your notes</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/70">
          Write private rich text notes and keep them synced to your workspace.
        </p>
      </div>
      <Link
        className="inline-flex min-h-10 items-center justify-center rounded-md bg-acc-3 px-4 py-2 text-sm font-semibold text-background shadow-sm transition hover:bg-acc-4 focus:outline-none focus:ring-2 focus:ring-acc-4 focus:ring-offset-2 focus:ring-offset-background"
        href="/notes/new"
      >
        New note
      </Link>
    </header>
  );
}

function formatNoteDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
