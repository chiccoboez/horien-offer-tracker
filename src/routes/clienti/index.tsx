import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerForm } from "@/components/CustomerForm";
import { customersQuery, deleteCustomer, type Customer } from "@/lib/customers";
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
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const qc = useQueryClient();
  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteCustomer(deleting.id);
      await qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente eliminato");
    } catch { toast.error("Eliminazione non riuscita"); }
    setDeleting(null);
  }
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
            <TableHeader><TableRow><TableHead>Ragione sociale</TableHead><TableHead>Indirizzo</TableHead><TableHead>Offerte</TableHead><TableHead className="w-24 text-right">Azioni</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Nessun cliente.</TableCell></TableRow>}
              {rows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium"><Link to="/clienti/$id" params={{ id: c.id }} className="text-primary hover:underline">{c.company_name}</Link></TableCell>
                  <TableCell className="max-w-xs truncate">{c.address || "—"}</TableCell>
                  <TableCell>{offers.filter((o) => o.customer_name === c.company_name).length}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" aria-label={`Modifica ${c.company_name}`} onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Elimina ${c.company_name}`} onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
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
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Modifica cliente</DialogTitle></DialogHeader>
          {editing && <CustomerForm key={editing.id} customer={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleting} onOpenChange={(o) => { if (!o) setDeleting(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare {deleting?.company_name}?</AlertDialogTitle>
            <AlertDialogDescription>Il cliente verrà rimosso dall'anagrafica. Le sue offerte restano invariate e mantengono il nome del cliente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
