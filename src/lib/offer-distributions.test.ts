import { describe, expect, it } from "vitest";
import { offerDistribution, offersByGeography } from "./offer-distributions";
import type { Offer } from "./offers";

const offer = (country: string, customer_name: string, region: string, offer_date = "2026-11-01"): Offer => ({
  id: "one", offer_name: "Offer", project_name: "Same project", offer_type: "budgetary", is_alert_dismissed: false,
  created_at: "2026-11-01", offer_date, po_date: null, customer_name, end_customer_name: "", battery_models: [],
  total_amount: 100, notes: "", country, region, status: "Offerta inviata", pdf_url: null,
});

describe("historical offer distributions", () => {
  it("counts all countries across all years, without collapsing projects", () => {
    const rows = [offer("KSA", "A", "Riyadh", "2025-01-01"), offer("KSA", "A", "Makkah"), offer("UAE", "B", "Dubai")];
    const distribution = offerDistribution(rows, "country");
    expect(distribution[0]?.name).toBe("KSA");
    expect(distribution[0]?.count).toBe(2);
    expect(distribution[0]?.percentage).toBeCloseTo(66.6667);
    expect(distribution[1]?.count).toBe(1);
  });
  it("groups customers using their exact stored names", () => {
    const rows = [offer("KSA", "A", ""), offer("KSA", "A", ""), offer("KSA", "a", "")];
    expect(offerDistribution(rows, "customer_name")).toEqual([
      { name: "A", count: 2, percentage: 2 / 3 * 100 }, { name: "a", count: 1, percentage: 1 / 3 * 100 },
    ]);
  });
  it("nests exact region names under their country without merging Makkah and Mecca", () => {
    const rows = [offer("KSA", "A", "Makkah"), offer("KSA", "A", "Mecca"), offer("UAE", "A", "Makkah")];
    const groups = offersByGeography(rows);
    expect(groups[0]?.count).toBe(2);
    expect(groups[0]?.regions.map((r) => [r.name, r.count])).toEqual([["Makkah", 1], ["Mecca", 1]]);
    expect(groups[1]?.regions[0]?.count).toBe(1);
  });
  it("keeps missing fields in explicit groups and handles an empty dataset", () => {
    expect(offersByGeography([offer("", "", "")])[0]).toEqual({ country: "Non specificato", count: 1, regions: [{ name: "Non specificato", count: 1, percentage: 100 }] });
    expect(offerDistribution([], "country")).toEqual([]);
    expect(offersByGeography([])).toEqual([]);
  });
});