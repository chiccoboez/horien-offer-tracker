import { useEffect } from "react";
import { format, getISOWeek, startOfWeek, addWeeks, startOfMonth, addMonths, startOfYear, addYears } from "date-fns";
import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const BATTERY_MODELS = [
  "24UP160", "24UP200", "48TL160", "48TL200", "110UP80",
  "125UP80", "220UP40", "250UP40", "380UP40", "450UP40",
] as const;
export const STATUSES = ["Offerta inviata", "LOI", "Ordinato", "perso"] as const;
export const OFFER_TYPES = ["budgetary", "official RFQ"] as const;
export const normalizeBatteryModel = (model: string) => model === "48UP160" ? "48TL160" : model === "48UP200" ? "48TL200" : model;
export const normalizeStatus = (status: string): OfferStatus => {
  if (status === "quoted") return "Offerta inviata";
  if (status === "PO received") return "Ordinato";
  if (status === "lost") return "perso";
  return status as OfferStatus;
};
export type OfferStatus = (typeof STATUSES)[number];
export type BatteryLine = { model: string; quantity: number };

export type Offer = {
  id: string;
  offer_name: string;
  project_name: string;
  offer_type: (typeof OFFER_TYPES)[number];
  is_alert_dismissed: boolean;
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
  exclude_from_metrics: boolean;
  validity_date: string | null;
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
      status: normalizeStatus(o.status),
      battery_models: ((Array.isArray(o.battery_models) ? o.battery_models : []) as BatteryLine[]).map((b) => ({ ...b, model: normalizeBatteryModel(b.model) })),
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

export function isFollowUpDue(o: Pick<Offer, "status" | "offer_date"> & Partial<Pick<Offer, "is_alert_dismissed">>, now = new Date()) {
  if (o.status !== "Offerta inviata" || o.is_alert_dismissed) return false;
  const limit = new Date(now);
  limit.setMonth(limit.getMonth() - 1);
  return new Date(o.offer_date) < limit;
}

/** Validity date before today while still "Offerta inviata". */
export function isExpired(o: Pick<Offer, "status" | "validity_date"> & Partial<Pick<Offer, "is_alert_dismissed">>, now = new Date()) {
  if (o.status !== "Offerta inviata" || o.is_alert_dismissed || !o.validity_date) return false;
  return o.validity_date < format(now, "yyyy-MM-dd");
}

export const isOrdered = (o: Pick<Offer, "status">) => o.status === "LOI" || o.status === "Ordinato";

/** Offers flagged as excluded are only shown in the offers table, never in calculations. */
export const metricOffers = <T extends { exclude_from_metrics?: boolean }>(offers: T[]) => offers.filter((o) => !o.exclude_from_metrics);

export const hasProjectName = (value: string) => value.trim().length > 0;

export type DashboardTimeframe = "week" | "month" | "year";

export function dashboardPeriod(timeframe: DashboardTimeframe, now = new Date()) {
  const start = timeframe === "week" ? startOfWeek(now, { weekStartsOn: 1 }) : timeframe === "month" ? startOfMonth(now) : startOfYear(now);
  const end = timeframe === "week" ? addWeeks(start, 1) : timeframe === "month" ? addMonths(start, 1) : addYears(start, 1);
  const label = timeframe === "week" ? `Settimana ${getISOWeek(now)}` : timeframe === "month" ? now.toLocaleDateString("it-IT", { month: "long", year: "numeric" }) : String(now.getFullYear());
  return { start: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd"), label };
}

export function dashboardOffers(offers: Offer[], now = new Date(), timeframe: DashboardTimeframe = "year") {
  const period = dashboardPeriod(timeframe, now);
  const projects = new Map<string, Offer>();
  for (const o of metricOffers(offers)) {
    if (o.offer_date < period.start || o.offer_date >= period.end) continue;
    // Unnamed legacy records are independent until their actual project is supplied.
    const key = o.project_name ? `project:${o.project_name}` : `offer:${o.id}`;
    const previous = projects.get(key);
    if (!previous || o.created_at > previous.created_at || (o.created_at === previous.created_at && o.id > previous.id)) projects.set(key, o);
  }
  return [...projects.values()];
}

export function metrics(offers: Offer[], now = new Date(), timeframe: DashboardTimeframe = "year") {
  const rows = dashboardOffers(offers, now, timeframe);
  const quoted = rows.filter((o) => !isOrdered(o)).reduce((s, o) => s + o.total_amount, 0);
  const won = rows.filter(isOrdered).reduce((s, o) => s + o.total_amount, 0);
  const byModel = BATTERY_MODELS.map((m) => ({
    model: m,
    quantity: rows.reduce(
      (s, o) => s + o.battery_models.filter((b) => normalizeBatteryModel(b.model) === m).reduce((a, b) => a + (Number(b.quantity) || 0), 0),
      0,
    ),
  }));
  return { count: rows.length, quoted, won, byModel };
}

export function groupByPeriod(offers: Offer[], mode: "month" | "year") {
  const map = new Map<string, { key: string; count: number; quotedBatteries: number; orderedBatteries: number; quotedAmount: number; orderedAmount: number }>();
  for (const o of metricOffers(offers)) {
    const key = mode === "year" ? o.offer_date.slice(0, 4) : o.offer_date.slice(0, 7);
    const g = map.get(key) ?? { key, count: 0, quotedBatteries: 0, orderedBatteries: 0, quotedAmount: 0, orderedAmount: 0 };
    g.count++;
    if (isOrdered(o)) {
      g.orderedBatteries += totalQty(o);
      g.orderedAmount += o.total_amount;
    } else {
      g.quotedBatteries += totalQty(o);
      g.quotedAmount += o.total_amount;
    }
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
  const head = ["offer_name", "project_name", "offer_type", "offer_date", "po_date", "customer_name", "end_customer_name", "battery_models", "total_amount", "country", "region", "status", "notes", "validity_date", "exclude_from_metrics"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = offers.map((o) =>
    [o.offer_name, o.project_name, o.offer_type, o.offer_date, o.po_date, o.customer_name, o.end_customer_name,
      o.battery_models.map((b) => `${b.model} x${b.quantity}`).join("; "),
      o.total_amount, o.country, o.region, o.status, o.notes, o.validity_date, o.exclude_from_metrics ? "si" : "no"].map(esc).join(","),
  );
  return [head.join(","), ...rows].join("\n");
}
