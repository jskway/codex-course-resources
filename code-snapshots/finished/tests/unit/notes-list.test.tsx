import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotesList } from "@/src/components/notes/notes-list";
import type { NoteListItem } from "@/src/lib/notes/types";

describe("NotesList", () => {
  it("renders an empty-state prompt when no notes exist", () => {
    render(<NotesList notes={[]} />);

    const heading = screen.getByRole("heading", { name: "No notes yet" });
    const createLink = screen.getByRole("link", { name: "Create note" });

    expect(heading).toBeTruthy();
    expect(createLink.getAttribute("href")).toBe("/notes/new");
  });

  it("renders notes with fallback title and fallback date text", () => {
    const notes: NoteListItem[] = [
      {
        id: "note-1",
        title: "",
        shareEnabled: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "invalid-date",
      },
      {
        id: "note-2",
        title: "Project plan",
        shareEnabled: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ];

    render(<NotesList notes={notes} />);

    const untitledLink = screen.getByRole("link", { name: /Untitled note/i });
    const titledLink = screen.getByRole("link", { name: /Project plan/i });

    expect(untitledLink.getAttribute("href")).toBe("/notes/note-1");
    expect(screen.getByText("Updated Unknown date")).toBeTruthy();
    expect(titledLink.getAttribute("href")).toBe("/notes/note-2");
  });
});
