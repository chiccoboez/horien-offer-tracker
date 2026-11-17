import { describe, expect, it } from "vitest";
import { cleanContacts, customerOffers } from "./customers";

describe("customers", () => {
  it("lists only offers with the exact company name, newest first", () => {
    const offers = [
      { customer_name: "ACME", offer_date: "2026-01-01" },
      { customer_name: "acme", offer_date: "2026-05-01" },
      { customer_name: "ACME", offer_date: "2026-03-01" },
    ];
    expect(customerOffers(offers, "ACME").map((o) => o.offer_date)).toEqual(["2026-03-01", "2026-01-01"]);
  });
  it("drops empty contact rows", () => {
    expect(cleanContacts([{ full_name: " ", role: "", email: "", phone: "" }, { full_name: "Ada", role: "", email: "", phone: "" }])).toHaveLength(1);
  });
});
