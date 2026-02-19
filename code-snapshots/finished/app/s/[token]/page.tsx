import { notFound } from "next/navigation";
import { PublicNoteContent } from "@/src/components/notes/public-note-content";
import { getSharedNoteByTokenHash } from "@/src/lib/notes/repository";
import { hashShareToken, isValidShareToken } from "@/src/lib/notes/sharing";

type SharedNotePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SharedNotePage({ params }: SharedNotePageProps) {
  const { token } = await params;

  if (!isValidShareToken(token)) {
    notFound();
  }

  const note = getSharedNoteByTokenHash(hashShareToken(token));

  if (!note) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 text-(--foreground)">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{note.title || "Untitled note"}</h1>
        <p className="text-sm text-(--foreground-muted)">Shared note</p>
      </header>

      <PublicNoteContent contentJson={note.contentJson} />
    </main>
  );
}
