import { notFound } from "next/navigation";
import { getNoteDisplayTitle, renderPublicNoteHtml } from "@/lib/note-content";
import { getSharedNoteByToken } from "@/lib/notes";

export default async function SharedNotePage({
  params,
}: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;
  const note = getSharedNoteByToken(token);
  if (note === null) notFound();

  return (
    <article className="rounded-lg border border-acc-2 bg-acc-1/80 p-8 shadow-sm">
      <h2 className="text-3xl font-semibold tracking-tight text-acc-5">
        {getNoteDisplayTitle(note.title)}
      </h2>
      <p className="mt-2 text-sm text-foreground/60">Shared from TinyNotes</p>
      <div
        className="tinynotes-editor prose prose-neutral mt-6 max-w-none"
        dangerouslySetInnerHTML={{ __html: renderPublicNoteHtml(note.contentJson) }}
      />
    </article>
  );
}
