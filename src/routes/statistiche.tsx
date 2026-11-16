import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { eur, groupByPeriod, offersQuery } from "@/lib/offers";
import { offerDistribution, offersByGeography } from "@/lib/offer-distributions";
import { OfferDistributionChart } from "@/components/OfferDistributionChart";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/statistiche")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Statistiche — HORIEN Offer Tracker" },
      { name: "description", content: "Andamento mensile e annuale di offerte, batterie e importi HORIEN." },
      { property: "og:title", content: "Statistiche — HORIEN Offer Tracker" },
      { property: "og:description", content: "Andamento mensile e annuale di offerte, batterie e importi HORIEN." },
    ],
  }),
  component: Stats,
});

const label = (key: string) =>
  key.length === 4 ? `Anno ${key}` : new Date(`${key}-01`).toLocaleDateString("it-IT", { month: "long", year: "numeric" });

function Stats() {
  const { data: offers = [] } = useQuery(offersQuery);
  const [mode, setMode] = useState<"month" | "year">("month");
  const rows = groupByPeriod(offers, mode).map((r) => ({ ...r, label: label(r.key) }));
  const countries = offerDistribution(offers, "country");
  const customers = offerDistribution(offers, "customer_name");
  const geography = offersByGeography(offers);
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Statistiche</h1>
        <Tabs value={mode} onValueChange={(v) => setMode(v as "month" | "year")}>
          <TabsList><TabsTrigger value="month">Per mese</TabsTrigger><TabsTrigger value="year">Per anno</TabsTrigger></TabsList>
        </Tabs>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Andamento</CardTitle></CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer>
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis yAxisId="l" allowDecimals={false} fontSize={12} />
              <YAxis yAxisId="r" orientation="right" fontSize={12} tickFormatter={(v) => `€${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number, n: string) => (n.startsWith("Importo") ? eur(v) : v)} />
              <Legend />
              <Bar yAxisId="l" dataKey="count" name="Offerte" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="l" dataKey="quotedBatteries" name="Batterie quotate" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="l" dataKey="orderedBatteries" name="Batterie ordinate" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              <Line yAxisId="r" dataKey="quotedAmount" name="Importo quotato" stroke="var(--chart-4)" strokeWidth={2} />
              <Line yAxisId="r" dataKey="orderedAmount" name="Importo ordinato" stroke="var(--chart-5)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Periodo</TableHead><TableHead className="text-right">N. offerte</TableHead><TableHead className="text-right">Batterie quotate</TableHead><TableHead className="text-right">Batterie ordinate</TableHead><TableHead className="text-right">Importo quotato</TableHead><TableHead className="text-right">Importo ordinato</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nessun dato disponibile.</TableCell></TableRow>}
              {[...rows].reverse().map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium capitalize">{r.label}</TableCell>
                  <TableCell className="text-right">{r.count}</TableCell>
                  <TableCell className="text-right">{r.quotedBatteries}</TableCell>
                  <TableCell className="text-right">{r.orderedBatteries}</TableCell>
                  <TableCell className="text-right font-semibold">{eur(r.quotedAmount)}</TableCell>
                  <TableCell className="text-right font-semibold">{eur(r.orderedAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="grid gap-8 border-t pt-6 md:grid-cols-2">
        <OfferDistributionChart title="Offerte per Paese — tutti gli anni" rows={countries} />
        <OfferDistributionChart title="Offerte per cliente — tutti gli anni" rows={customers} />
      </div>
      <section className="space-y-3 border-t pt-6" aria-label="Offerte per Paese e regione">
        <h2 className="text-base font-semibold">Offerte per Paese e Città / Regione — tutti gli anni</h2>
        {geography.length === 0 ? <p className="text-sm text-muted-foreground">Nessun dato disponibile.</p> : <Accordion type="multiple">
          {geography.map((group) => <AccordionItem key={group.country} value={group.country}>
            <AccordionTrigger><span className="flex min-w-0 flex-1 items-center justify-between gap-3 pr-3"><span className="break-words">{group.country}</span><span className="shrink-0 tabular-nums text-muted-foreground">{group.count} offerte</span></span></AccordionTrigger>
            <AccordionContent>
              <Table><TableHeader><TableRow><TableHead>Città / Regione</TableHead><TableHead className="text-right">N. offerte</TableHead></TableRow></TableHeader><TableBody>
                {group.regions.map((region) => <TableRow key={region.name}><TableCell className="whitespace-normal break-words">{region.name}</TableCell><TableCell className="text-right tabular-nums">{region.count}</TableCell></TableRow>)}
              </TableBody></Table>
            </AccordionContent>
          </AccordionItem>)}
        </Accordion>}
      </section>
    </div>
  );
}
