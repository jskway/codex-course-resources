import { createEmptyTiptapContent } from "@/lib/note-content";
import { NoteEditor } from "../note-editor";

export default function NewNotePage() {
  return (
    <NoteEditor initialContentJson={createEmptyTiptapContent()} initialTitle="" mode="create" />
  );
}
