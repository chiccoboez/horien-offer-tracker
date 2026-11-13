import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Euro, Trophy } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OfferForm } from "@/components/OfferForm";
import { eur, isFollowUpDue, metrics, offersQuery } from "@/lib/offers";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — HORIEN Offer Tracker" },
      { name: "description", content: "Metriche, promemoria e inserimento nuove offerte HORIEN." },
      { property: "og:title", content: "Dashboard — HORIEN Offer Tracker" },
      { property: "og:description", content: "Metriche, promemoria e inserimento nuove offerte HORIEN." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: offers = [] } = useQuery(offersQuery);
  const m = metrics(offers);
  const alerts = offers.filter((o) => isFollowUpDue(o));
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Principale</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Stat icon={<Euro />} label="Valore offerte Quoted" value={eur(m.quoted)} />
        <Stat icon={<Trophy />} label="Valore LOI + PO received" value={eur(m.won)} accent />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Batterie per modello</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer>
            <BarChart data={m.byModel}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="model" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Bar dataKey="quantity" name="Quantità" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-warning" /> Promemoria follow-up ({alerts.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {alerts.length === 0 && <p className="text-sm text-muted-foreground">Nessun promemoria: tutte le offerte sono aggiornate.</p>}
          {alerts.map((o) => (
            <div key={o.id} className="rounded-md border-l-4 border-warning bg-muted px-4 py-2 text-sm">
              Promemoria: Contattare il cliente <b>{o.customer_name}</b> per l'offerta <b>{o.offer_name}</b>
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

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <Card className={accent ? "bg-secondary text-secondary-foreground" : ""}>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="rounded-full bg-primary p-3 text-primary-foreground [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
        <div><p className="text-sm opacity-75">{label}</p><p className="text-2xl font-bold">{value}</p></div>
      </CardContent>
    </Card>
  );
}
