import { notFound } from "next/navigation";
import { getNoteForUser } from "@/lib/notes";
import { requireSession } from "@/lib/session";
import { NoteEditor } from "../note-editor";

export default async function NoteDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const session = await requireSession();
  const { id } = await params;
  const note = getNoteForUser(session.user.id, id);

  if (note === null) {
    notFound();
  }

  return (
    <NoteEditor
      initialContentJson={note.contentJson}
      initialTitle={note.title}
      mode="edit"
      noteId={note.id}
    />
  );
}
