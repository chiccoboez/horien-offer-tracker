import { describe, expect, it } from "vitest";
import { BATTERY_MODELS, OFFER_TYPES, STATUSES, dashboardOffers, dashboardPeriod, groupByPeriod, hasProjectName, isFollowUpDue, metrics, normalizeBatteryModel, normalizeStatus, totalQty, type Offer } from "./offers";

const now = new Date("2026-11-14T12:00:00Z");
const offer = (changes: Partial<Offer> = {}): Offer => ({
  id: "one", offer_name: "Offer", project_name: "Project", offer_type: "budgetary", is_alert_dismissed: false,
  created_at: "2026-11-01T12:00:00Z", offer_date: "2026-11-01", po_date: null,
  customer_name: "", end_customer_name: "", battery_models: [{ model: "24UP160", quantity: 3 }],
  total_amount: 100, notes: "", country: "", region: "", status: "Offerta inviata", pdf_url: null, exclude_from_metrics: false, validity_date: null, ...changes,
});
describe("offer rules", () => {
  it("filters current week from Monday through Sunday using offer_date", () => {
    const date = new Date(2026, 10, 12, 12);
    const rows = [offer({ id: "before", project_name: "Before", offer_date: "2026-11-08" }), offer({ offer_date: "2026-11-09" }), offer({ id: "sun", project_name: "Sunday", offer_date: "2026-11-15", status: "LOI", total_amount: 50 }), offer({ id: "after", project_name: "After", offer_date: "2026-11-16" })];
    const result = metrics(rows, date, "week");
    expect(result.count).toBe(2);
    expect(result.quoted).toBe(100);
    expect(result.won).toBe(50);
    expect(result.byModel[0]?.quantity).toBe(6);
    expect(dashboardPeriod("week", date).label).toBe("Settimana 46");
  });
  it("filters the current month before applying latest-project selection", () => {
    const rows = [offer(), offer({ id: "latest", created_at: "2026-11-10", offer_date: "2026-11-30", status: "Ordinato", total_amount: 200 }), offer({ id: "oct", project_name: "October", offer_date: "2026-10-31" }), offer({ id: "dec", project_name: "December", offer_date: "2026-12-01" })];
    const result = metrics(rows, now, "month");
    expect(result.count).toBe(1);
    expect(result.quoted).toBe(0);
    expect(result.won).toBe(200);
    expect(result.byModel[0]?.quantity).toBe(3);
  });
  it("includes both years in a current ISO week crossing New Year", () => {
    const rows = [offer({ offer_date: "2025-12-29" }), offer({ id: "two", project_name: "Two", offer_date: "2026-01-04" }), offer({ id: "out", project_name: "Out", offer_date: "2026-01-05" })];
    expect(metrics(rows, new Date(2026, 0, 1, 12), "week").count).toBe(2);
  });
  it("requires a nonblank project name", () => {
    expect(hasProjectName("")).toBe(false);
    expect(hasProjectName("  ")).toBe(false);
    expect(hasProjectName("Project")).toBe(true);
  });
  it("allows exactly the two requested offer types", () => {
    expect([...OFFER_TYPES]).toEqual(["budgetary", "official RFQ"]);
  });
  it("migrates legacy statuses to the four requested values", () => {
    expect([...STATUSES]).toEqual(["Offerta inviata", "LOI", "Ordinato", "perso"]);
    expect(normalizeStatus("quoted")).toBe("Offerta inviata");
    expect(normalizeStatus("PO received")).toBe("Ordinato");
    expect(normalizeStatus("lost")).toBe("perso");
    expect(normalizeStatus("LOI")).toBe("LOI");
  });
  it("replaces 48UP identifiers while preserving legacy battery quantities", () => {
    expect([...BATTERY_MODELS]).toEqual(["24UP160", "24UP200", "48TL160", "48TL200", "110UP80", "125UP80", "220UP40", "250UP40", "380UP40", "450UP40"]);
    expect(normalizeBatteryModel("48UP160")).toBe("48TL160");
    expect(normalizeBatteryModel("48UP200")).toBe("48TL200");
    expect(metrics([offer({ battery_models: [{ model: "48UP200", quantity: 7 }] })], now).byModel.find((m) => m.model === "48TL200")?.quantity).toBe(7);
  });
  it("alerts only sent offers older than one month", () => {
    expect(isFollowUpDue(offer({ offer_date: "2026-10-01" }), now)).toBe(true);
    expect(isFollowUpDue(offer(), now)).toBe(false);
    for (const status of ["LOI", "Ordinato", "perso"] as const) expect(isFollowUpDue(offer({ status, offer_date: "2026-01-01" }), now)).toBe(false);
  });
  it("never shows dismissed alerts even after time advances", () => {
    const dismissed = offer({ offer_date: "2026-01-01", is_alert_dismissed: true });
    expect(isFollowUpDue(dismissed, now)).toBe(false);
    expect(isFollowUpDue(dismissed, new Date("2027-11-14"))).toBe(false);
  });
  it("limits every dashboard metric to the current year", () => {
    const m = metrics([offer(), offer({ id: "old", project_name: "Old", offer_date: "2025-12-31", total_amount: 999 }), offer({ id: "future", project_name: "Future", offer_date: "2027-01-01", status: "Ordinato", total_amount: 500 })], now);
    expect(m.quoted).toBe(100);
    expect(m.won).toBe(0);
    expect(m.byModel[0]?.quantity).toBe(3);
  });
  it("uses only the most recently created offer per exact project name", () => {
    const latest = offer({ id: "new", created_at: "2026-11-02T12:00:00Z", offer_date: "2026-10-01", total_amount: 250, battery_models: [{ model: "24UP160", quantity: 8 }], status: "LOI" });
    const rows = [offer(), latest];
    expect(dashboardOffers(rows, now)).toEqual([latest]);
    expect(metrics(rows, now).quoted).toBe(0);
    expect(metrics(rows, now).won).toBe(250);
    expect(metrics(rows, now).byModel[0]?.quantity).toBe(8);
  });
  it("does not merge different case or unnamed legacy projects", () => {
    const rows = [offer(), offer({ id: "two", project_name: "project" }), offer({ id: "three", project_name: "" }), offer({ id: "four", project_name: "" })];
    expect(metrics(rows, now).quoted).toBe(400);
  });
  it("includes perso in sent totals subject to latest-project selection", () => {
    const m = metrics([offer(), offer({ id: "lost", created_at: "2026-11-03T00:00:00Z", status: "perso", total_amount: 70 })], now);
    expect(m.quoted).toBe(70);
    expect(m.won).toBe(0);
    expect(m.byModel[0]?.quantity).toBe(3);
  });
  it("moves amounts from sent to ordered immediately on status transition", () => {
    const sent = offer();
    expect(metrics([sent], now).quoted).toBe(100);
    expect(metrics([sent], now).won).toBe(0);
    const ordered = metrics([{ ...sent, status: "Ordinato" }], now);
    expect(ordered.quoted).toBe(0);
    expect(ordered.won).toBe(100);
    expect(metrics([{ ...sent, status: "LOI" }], now).won).toBe(100);
  });
  it("sums all battery lines for an individual offer", () => {
    expect(totalQty(offer({ battery_models: [{ model: "24UP160", quantity: 3 }, { model: "48TL200", quantity: 7 }] }))).toBe(10);
  });
  it("keeps all historical offers and splits monthly and annual amounts and batteries", () => {
    const rows = [offer({ offer_date: "2025-01-01" }), offer({ id: "two", offer_date: "2025-01-02", status: "LOI", total_amount: 50 }), offer({ id: "three", offer_date: "2025-01-03", status: "Ordinato", total_amount: 25 }), offer({ id: "four", offer_date: "2025-01-04", status: "perso", total_amount: 10 }), offer()];
    const expected = { count: 4, quotedBatteries: 6, orderedBatteries: 6, quotedAmount: 110, orderedAmount: 75 };
    expect(groupByPeriod(rows, "month")[0]).toEqual({ key: "2025-01", ...expected });
    expect(groupByPeriod(rows, "year")[0]).toEqual({ key: "2025", ...expected });
    expect(groupByPeriod(rows, "year")[1]?.quotedAmount).toBe(100);
  });
});

describe("exclude_from_metrics", () => {
  it("ignores excluded offers in dashboard metrics and history", () => {
    const now = new Date("2026-11-17T12:00:00Z");
    const rows = [offer({ offer_date: "2026-11-10" }), offer({ id: "x", project_name: "Excluded", offer_date: "2026-11-10", total_amount: 5000, exclude_from_metrics: true })];
    expect(metrics(rows, now).count).toBe(1);
    expect(metrics(rows, now).quoted).toBe(100);
    expect(groupByPeriod(rows, "year")[0]?.count).toBe(1);
  });
});
