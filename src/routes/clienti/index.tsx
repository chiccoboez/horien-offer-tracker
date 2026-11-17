import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerForm } from "@/components/CustomerForm";
import { customersQuery } from "@/lib/customers";
import { offersQuery } from "@/lib/offers";

export const Route = createFileRoute("/clienti/")({
  head: () => ({
    meta: [
      { title: "Clienti — HORIEN Offer Tracker" },
      { name: "description", content: "Anagrafica clienti HORIEN con referenti e storico offerte." },
      { property: "og:title", content: "Clienti — HORIEN Offer Tracker" },
      { property: "og:description", content: "Anagrafica clienti HORIEN con referenti e storico offerte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { data: customers = [] } = useQuery(customersQuery);
  const { data: offers = [] } = useQuery(offersQuery);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rows = customers.filter((c) => c.company_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clienti</h1>
          <p className="text-sm text-muted-foreground">{customers.length} clienti registrati</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Aggiungi Cliente</Button>
      </div>
      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Cerca cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Ragione sociale</TableHead><TableHead>Indirizzo</TableHead><TableHead>Referenti</TableHead><TableHead>Offerte</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Nessun cliente.</TableCell></TableRow>}
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium"><Link to="/clienti/$id" params={{ id: c.id }} className="text-primary hover:underline">{c.company_name}</Link></TableCell>
                  <TableCell className="max-w-xs truncate">{c.address || "—"}</TableCell>
                  <TableCell>{c.contacts.length}</TableCell>
                  <TableCell>{offers.filter((o) => o.customer_name === c.company_name).length}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Nuovo cliente</DialogTitle></DialogHeader>
          {open && <CustomerForm onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
