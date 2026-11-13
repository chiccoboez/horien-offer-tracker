import { useEffect } from "react";
import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BATTERY_MODELS = [
  "24UP160", "24UP200", "48UP160", "48UP200", "110UP80",
  "125UP80", "220UP40", "250UP40", "380UP40", "450UP40",
] as const;
export const STATUSES = ["quoted", "LOI", "PO received"] as const;
export type OfferStatus = (typeof STATUSES)[number];
export type BatteryLine = { model: string; quantity: number };

export type Offer = {
  id: string;
  offer_name: string;
  created_at: string;
  offer_date: string;
  po_date: string | null;
  customer_name: string;
  end_customer_name: string;
  battery_models: BatteryLine[];
  total_amount: number;
  notes: string;
  country: string;
  region: string;
  status: OfferStatus;
  pdf_url: string | null;
};
export type OfferInput = Omit<Offer, "id" | "created_at">;

export const offersQuery = queryOptions({
  queryKey: ["offers"],
  queryFn: async (): Promise<Offer[]> => {
    const { data, error } = await supabase.from("offers").select("*").order("offer_date", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((o) => ({
      ...o,
      total_amount: Number(o.total_amount),
      battery_models: (Array.isArray(o.battery_models) ? o.battery_models : []) as BatteryLine[],
    })) as Offer[];
  },
});

/** Subscribes once to database changes and refreshes every view. */
export function useOffersRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel(`offers-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "offers" }, () =>
        qc.invalidateQueries({ queryKey: ["offers"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);
}

export const eur = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n || 0);

export const totalQty = (o: Offer) => o.battery_models.reduce((s, b) => s + (Number(b.quantity) || 0), 0);

export function isFollowUpDue(o: Pick<Offer, "status" | "offer_date">, now = new Date()) {
  if (o.status !== "quoted") return false;
  const limit = new Date(now);
  limit.setMonth(limit.getMonth() - 1);
  return new Date(o.offer_date) < limit;
}

export function metrics(offers: Offer[]) {
  const quoted = offers.filter((o) => o.status === "quoted").reduce((s, o) => s + o.total_amount, 0);
  const won = offers.filter((o) => o.status !== "quoted").reduce((s, o) => s + o.total_amount, 0);
  const byModel = BATTERY_MODELS.map((m) => ({
    model: m,
    quantity: offers.reduce(
      (s, o) => s + o.battery_models.filter((b) => b.model === m).reduce((a, b) => a + (Number(b.quantity) || 0), 0),
      0,
    ),
  }));
  return { quoted, won, byModel };
}

export function groupByPeriod(offers: Offer[], mode: "month" | "year") {
  const map = new Map<string, { key: string; count: number; batteries: number; amount: number }>();
  for (const o of offers) {
    const key = mode === "year" ? o.offer_date.slice(0, 4) : o.offer_date.slice(0, 7);
    const g = map.get(key) ?? { key, count: 0, batteries: 0, amount: 0 };
    g.count++;
    g.batteries += totalQty(o);
    g.amount += o.total_amount;
    map.set(key, g);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export async function uploadPdf(file: File) {
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("offer-pdfs").upload(path, file, { contentType: "application/pdf" });
  if (error) throw error;
  return path;
}

export async function openPdf(path: string) {
  const { data, error } = await supabase.storage.from("offer-pdfs").createSignedUrl(path, 3600);
  if (error) throw error;
  window.open(data.signedUrl, "_blank");
}

export function toCsv(offers: Offer[]) {
  const head = ["offer_name", "offer_date", "po_date", "customer_name", "end_customer_name", "battery_models", "total_amount", "country", "region", "status", "notes"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = offers.map((o) =>
    [o.offer_name, o.offer_date, o.po_date, o.customer_name, o.end_customer_name,
      o.battery_models.map((b) => `${b.model} x${b.quantity}`).join("; "),
      o.total_amount, o.country, o.region, o.status, o.notes].map(esc).join(","),
  );
  return [head.join(","), ...rows].join("\n");
}
