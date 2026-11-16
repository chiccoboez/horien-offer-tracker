import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Euro, Trophy, X, FileText, Battery } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferForm } from "@/components/OfferForm";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dashboardPeriod, eur, isFollowUpDue, metrics, offersQuery, type DashboardTimeframe } from "@/lib/offers";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Dashboard — HORIEN Offer Tracker" },
      { name: "description", content: "Metriche, promemoria e inserimento nuove offerte HORIEN." },
      { property: "og:title", content: "Dashboard — HORIEN Offer Tracker" },
      { property: "og:description", content: "Metriche, promemoria e inserimento nuove offerte HORIEN." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [timeframe, setTimeframe] = useState<DashboardTimeframe>("year");
  const { data: offers = [] } = useQuery(offersQuery);
  const qc = useQueryClient();
  const dismiss = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").update({ is_alert_dismissed: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["offers"] }),
    onError: () => toast.error("Impossibile nascondere il promemoria"),
  });
  const now = new Date();
  const period = dashboardPeriod(timeframe, now);
  const m = metrics(offers, now, timeframe);
  const alerts = offers.filter((o) => isFollowUpDue(o));
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard Principale</h1>
        <Tabs value={timeframe} onValueChange={(value) => { if (value === "week" || value === "month" || value === "year") setTimeframe(value); }}>
          <TabsList><TabsTrigger value="week">Settimana</TabsTrigger><TabsTrigger value="month">Mese</TabsTrigger><TabsTrigger value="year">Anno</TabsTrigger></TabsList>
        </Tabs>
      </div>
      <h2 className="text-lg font-medium capitalize">{period.label}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Stat icon={<FileText />} label="Numero totale offerte" value={String(m.count)} />
        <Stat icon={<Euro />} label="Valore Offerta inviata" value={eur(m.quoted)} />
        <Stat icon={<Trophy />} label="Valore LOI + Ordinato" value={eur(m.won)} />
      </div>
      <section className="space-y-3" aria-label="Riepilogo batterie">
        <h2 className="flex items-center gap-2 text-base font-semibold"><Battery className="h-4 w-4 text-primary" />Riepilogo modelli batterie</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-5">
          {m.byModel.map(({ model, quantity }) => <div key={model} className="flex items-center justify-between gap-2 border-b py-2 text-sm"><dt>{model}</dt><dd className="font-semibold tabular-nums">{quantity}</dd></div>)}
        </dl>
      </section>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-warning" /> Promemoria follow-up ({alerts.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {alerts.length === 0 && <p className="text-sm text-muted-foreground">Nessun promemoria: tutte le offerte sono aggiornate.</p>}
          {alerts.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3 rounded-md border-l-4 border-warning bg-muted px-4 py-2 text-sm">
              <span className="min-w-0 break-words">Promemoria: Contattare il cliente <b>{o.customer_name}</b> per l'offerta <b>{o.offer_name}</b></span>
              <Button type="button" variant="ghost" size="icon" className="shrink-0" aria-label={`Nascondi promemoria ${o.offer_name}`} title="Nascondi promemoria" disabled={dismiss.isPending} onClick={() => dismiss.mutate(o.id)}><X className="h-4 w-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Nuova Offerta</CardTitle></CardHeader>
        <CardContent><OfferForm /></CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-full bg-primary p-3 text-primary-foreground [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
        <div className="min-w-0"><p className="text-sm opacity-75">{label}</p><p className="break-words text-xl font-bold tabular-nums">{value}</p></div>
      </CardContent>
    </Card>
  );
}
