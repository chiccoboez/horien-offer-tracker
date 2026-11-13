import { describe, expect, it } from "vitest";
import { isFollowUpDue, metrics, type Offer } from "./offers";

const base = { battery_models: [], total_amount: 0 } as unknown as Offer;
describe("offer rules", () => {
  it("alerts quoted offers older than one month", () => {
    const now = new Date("2026-11-13");
    expect(isFollowUpDue({ status: "quoted", offer_date: "2026-10-01" }, now)).toBe(true);
    expect(isFollowUpDue({ status: "quoted", offer_date: "2026-11-01" }, now)).toBe(false);
    expect(isFollowUpDue({ status: "LOI", offer_date: "2026-01-01" }, now)).toBe(false);
  });
  it("sums LOI + PO received separately from quoted", () => {
    const m = metrics([
      { ...base, status: "quoted", total_amount: 100 },
      { ...base, status: "LOI", total_amount: 50 },
      { ...base, status: "PO received", total_amount: 25, battery_models: [{ model: "24UP160", quantity: 3 }] },
    ]);
    expect(m.quoted).toBe(100);
    expect(m.won).toBe(75);
    expect(m.byModel.find((b) => b.model === "24UP160")?.quantity).toBe(3);
  });
});
