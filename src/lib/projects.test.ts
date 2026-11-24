import { describe, expect, it } from "vitest";
import { PROJECT_STATUSES, projectPayload, filterProjects, type ProjectInput, type Project } from "./projects";

const input: ProjectInput = { start_date: "2026-11-23", project_name: " Plant ", end_customer_name: "End client", involved_companies: [" ACME ", "", "  ", "Beta"], country: "Italy", specifications_text: "Specs", specifications_file_url: null, specifications_file_name: null, notes: "Notes", status: "FEED", winning_company: "ACME" };
describe("projects", () => {
  it("offers exactly the three required statuses", () => { expect(PROJECT_STATUSES).toEqual(["FEED", "RFQ", "Completato"]); });
  it("saves winning company only for Completato", () => {
    expect(projectPayload(input).winning_company).toBeNull();
    expect(projectPayload({ ...input, status: "RFQ" }).winning_company).toBeNull();
    expect(projectPayload({ ...input, status: "Completato" }).winning_company).toBe("ACME");
  });
  it("keeps nonempty manually entered company names", () => { expect(projectPayload(input).involved_companies).toEqual(["ACME", "Beta"]); });
  it("searches companies and filters status together", () => {
    const rows: Project[] = [{ ...projectPayload(input), id: "a", created_at: "2026-11-23" }, { ...projectPayload(input), id: "b", created_at: "2026-11-23", status: "RFQ" }];
    expect(filterProjects(rows, "acme", "RFQ").map((p) => p.id)).toEqual(["b"]);
    expect(filterProjects(rows, "missing", "all")).toEqual([]);
  });
});