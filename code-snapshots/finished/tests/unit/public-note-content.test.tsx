import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PublicNoteContent } from "@/src/components/notes/public-note-content";

describe("PublicNoteContent", () => {
  it("preserves allowed text formatting content", () => {
    render(
      <PublicNoteContent
        contentJson={{
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: "A" },
                { type: "text", text: " bold", marks: [{ type: "bold" }] },
                { type: "text", text: " italic", marks: [{ type: "italic" }] },
              ],
            },
          ],
        }}
      />,
    );

    const paragraph = screen.getByText("bold").closest("p");
    expect(paragraph?.textContent).toBe("A bold italic");
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("italic").tagName).toBe("EM");
  });

  it("drops unknown nodes", () => {
    render(
      <PublicNoteContent
        contentJson={{
          type: "doc",
          content: [
            {
              type: "customNode",
              content: [{ type: "text", text: "should not render" }],
            },
            {
              type: "paragraph",
              content: [{ type: "text", text: "should render" }],
            },
          ],
        }}
      />,
    );

    expect(screen.queryByText("should not render")).toBeNull();
    expect(screen.getByText("should render")).toBeTruthy();
  });

  it("blocks malicious links while preserving text", () => {
    render(
      <PublicNoteContent
        contentJson={{
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "bad link",
                  marks: [
                    {
                      type: "link",
                      attrs: {
                        href: "javascript:alert(1)",
                      },
                    },
                  ],
                },
                {
                  type: "text",
                  text: " good link",
                  marks: [
                    {
                      type: "link",
                      attrs: {
                        href: "https://example.com",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("bad link").closest("a")).toBeNull();
    const goodLink = screen.getByRole("link", { name: "good link" });
    expect(goodLink.getAttribute("href")).toBe("https://example.com/");
    expect(goodLink.getAttribute("rel")).toContain("noreferrer");
    expect(goodLink.getAttribute("target")).toBe("_blank");
  });
});
