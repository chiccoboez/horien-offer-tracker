import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { customerOffers, customersQuery } from "@/lib/customers";
import { eur, offersQuery } from "@/lib/offers";

export const Route = createFileRoute("/clienti/$id")({
  head: () => ({
    meta: [
      { title: "Scheda cliente — HORIEN Offer Tracker" },
      { name: "description", content: "Profilo cliente con referenti, ordini e offerte." },
      { property: "og:title", content: "Scheda cliente — HORIEN Offer Tracker" },
      { property: "og:description", content: "Profilo cliente con referenti, ordini e offerte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomerDetail,
});

function CustomerDetail() {
  const { id } = Route.useParams();
  const { data: customers, isLoading } = useQuery(customersQuery);
  const { data: offers = [] } = useQuery(offersQuery);
  const c = customers?.find((x) => x.id === id);
  if (isLoading) return <p className="text-muted-foreground">Caricamento…</p>;
  if (!c) return <p className="text-muted-foreground">Cliente non trovato. <Link to="/clienti" className="text-primary underline">Torna ai clienti</Link></p>;
  const rows = customerOffers(offers, c.company_name);

  return (
    <div className="space-y-6">
      <Link to="/clienti" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Clienti</Link>
      <div>
        <h1 className="text-2xl font-bold text-foreground">{c.company_name}</h1>
        {c.address && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{c.address}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {c.contacts.length === 0 && <p className="text-sm text-muted-foreground">Nessun referente.</p>}
        {c.contacts.map((p, i) => (
          <Card key={i}>
            <CardContent className="space-y-1 p-4 text-sm">
              <p className="font-semibold text-foreground">{p.full_name || "—"}</p>
              {p.role && <p className="text-muted-foreground">{p.role}</p>}
              {p.email && <a href={`mailto:${p.email}`} className="flex items-center gap-1.5 text-primary hover:underline"><Mail className="h-3.5 w-3.5" />{p.email}</a>}
              {p.phone && <a href={`tel:${p.phone}`} className="flex items-center gap-1.5 text-primary hover:underline"><Phone className="h-3.5 w-3.5" />{p.phone}</a>}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>Ordini ed Offerte</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Offerta</TableHead><TableHead>Stato</TableHead><TableHead className="text-right">Importo</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">Nessuna offerta per questo cliente.</TableCell></TableRow>}
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>{new Date(o.offer_date).toLocaleDateString("it-IT")}</TableCell>
                  <TableCell>{o.offer_name}</TableCell>
                  <TableCell><Badge variant={o.status === "perso" ? "destructive" : o.status === "Offerta inviata" ? "outline" : o.status === "LOI" ? "secondary" : "default"}>{o.status}</Badge></TableCell>
                  <TableCell className="text-right">{eur(o.total_amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
