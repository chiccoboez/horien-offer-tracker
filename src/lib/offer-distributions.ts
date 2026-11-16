import type { Offer } from "./offers";

export type OfferDistribution = { name: string; count: number; percentage: number };

export function offerDistribution(offers: Offer[], field: "country" | "customer_name" | "region"): OfferDistribution[] {
  const counts = new Map<string, number>();
  for (const offer of offers) {
    const name = offer[field] || "Non specificato";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => ({ name, count, percentage: count / offers.length * 100 }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function offersByGeography(offers: Offer[]) {
  const groups = new Map<string, Offer[]>();
  for (const offer of offers) {
    const country = offer.country || "Non specificato";
    const rows = groups.get(country) ?? [];
    rows.push(offer);
    groups.set(country, rows);
  }
  return [...groups].map(([country, rows]) => ({ country, count: rows.length, regions: offerDistribution(rows, "region") }))
    .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country));
}