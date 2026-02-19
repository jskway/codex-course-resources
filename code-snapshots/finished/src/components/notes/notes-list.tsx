import Link from "next/link";
import type { NoteListItem } from "@/src/lib/notes/types";

export type NotesListProps = {
  notes: NoteListItem[];
};

function formatTimestamp(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function deriveNoteTitle(value: string): string {
  return value.trim() || "Untitled note";
}

export function NotesList({ notes }: NotesListProps) {
  if (notes.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-(--border) bg-(--surface-soft) p-8 text-center">
        <h2 className="text-xl font-semibold text-(--foreground)">No notes yet</h2>
        <p className="mt-2 text-sm text-(--foreground-muted)">
          Create your first note and start writing.
        </p>
        <Link
          href="/notes/new"
          className="mt-6 inline-flex items-center rounded-lg bg-(--accent) px-4 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-(--accent-strong)"
        >
          Create note
        </Link>
      </section>
    );
  }

  return (
    <ul className="grid gap-3">
      {notes.map((note) => (
        <li key={note.id}>
          <Link
            href={`/notes/${note.id}`}
            className="group flex items-center justify-between gap-3 rounded-xl border border-(--border) bg-(--surface-soft) px-4 py-3 transition-colors hover:border-(--accent) hover:bg-(--surface)"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-(--foreground)">
                {deriveNoteTitle(note.title)}
              </p>
              <p className="mt-1 text-xs text-(--foreground-muted)">
                Updated {formatTimestamp(note.updatedAt)}
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-(--accent) transition-colors group-hover:text-teal-100">
              Open
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
