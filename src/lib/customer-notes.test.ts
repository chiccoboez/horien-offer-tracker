import { describe, expect, it } from "vitest";
import { readCustomerNotes } from "./customer-notes";

describe("customer notes", () => {
  it("shows newest note dates first and retains attachment details", () => {
    const notes = readCustomerNotes([
      { id: "old", note_date: "2026-01-01", title: "Earlier", body: "Call" },
      { id: "new", note_date: "2026-11-23", title: "Latest", body: "Email", attachment_url: "customer-notes/file.pdf", attachment_name: "file.pdf" },
    ]);
    expect(notes.map((n) => n.id)).toEqual(["new", "old"]);
    expect(notes.find((n) => n.id === "new")?.attachment_name).toBe("file.pdf");
  });
  it("accepts empty history and skips malformed legacy entries", () => {
    expect(readCustomerNotes([])).toEqual([]);
    expect(readCustomerNotes([null, "bad", { title: "No id" }])).toEqual([]);
  });
});