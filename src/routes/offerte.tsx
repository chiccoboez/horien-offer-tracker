import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { OfferForm } from "@/components/OfferForm";
import { BATTERY_MODELS, STATUSES, eur, offersQuery, openPdf, toCsv, totalQty, type Offer } from "@/lib/offers";

export const Route = createFileRoute("/offerte")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Gestione Offerte — HORIEN Offer Tracker" },
      { name: "description", content: "Elenco, ricerca, modifica ed export CSV delle offerte HORIEN." },
      { property: "og:title", content: "Gestione Offerte — HORIEN Offer Tracker" },
      { property: "og:description", content: "Elenco, ricerca, modifica ed export CSV delle offerte HORIEN." },
    ],
  }),
  component: OffersPage,
});

const ALL = "__all";

function OffersPage() {
  const qc = useQueryClient();
  const { data: offers = [] } = useQuery(offersQuery);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(ALL);
  const [model, setModel] = useState(ALL);
  const [region, setRegion] = useState(ALL);
  const [editing, setEditing] = useState<Offer | null>(null);
  const [deleting, setDeleting] = useState<Offer | null>(null);

  const regions = useMemo(() => [...new Set(offers.map((o) => o.region).filter(Boolean))].sort(), [offers]);
  const rows = offers.filter((o) => {
    if (tab === "quoted" && o.status !== "Offerta inviata") return false;
    if (status !== ALL && o.status !== status) return false;
    if (model !== ALL && !o.battery_models.some((b) => b.model === model)) return false;
    if (region !== ALL && o.region !== region) return false;
    const s = q.toLowerCase();
    return !s || [o.customer_name, o.end_customer_name, o.country, o.offer_name, o.project_name].some((f) => f.toLowerCase().includes(s));
  });

  function exportCsv() {
    const blob = new Blob(["\ufeff" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `offerte-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await supabase.from("offers").delete().eq("id", deleting.id);
    if (error) { toast.error(error.message); return; }
    if (deleting.pdf_url) await supabase.storage.from("offer-pdfs").remove([deleting.pdf_url]);
    await qc.invalidateQueries({ queryKey: ["offers"] });
    toast.success("Offerta eliminata");
    setDeleting(null);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Gestione Offerte</h1>
        <Button onClick={exportCsv}><Download className="h-4 w-4" /> Export to CSV</Button>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList><TabsTrigger value="all">Tutte le offerte</TabsTrigger><TabsTrigger value="quoted">Solo Offerta inviata</TabsTrigger></TabsList>
      </Tabs>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-60 flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Cerca cliente, cliente finale, paese, offerta, progetto…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Filter value={status} onChange={setStatus} placeholder="Stato" options={[...STATUSES]} />
        <Filter value={model} onChange={setModel} placeholder="Modello" options={[...BATTERY_MODELS]} />
        <Filter value={region} onChange={setRegion} placeholder="Città / Regione" options={regions} />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Offerta</TableHead><TableHead>Progetto</TableHead><TableHead>Tipo offerta</TableHead><TableHead>Data</TableHead><TableHead>Cliente</TableHead>
                <TableHead>Cliente finale</TableHead><TableHead>Modelli</TableHead><TableHead className="text-right">Totale Batterie</TableHead><TableHead>Paese</TableHead><TableHead>Città / Regione</TableHead>
                <TableHead className="text-right">Importo</TableHead><TableHead>Stato</TableHead><TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={13} className="py-10 text-center text-muted-foreground">Nessuna offerta trovata.</TableCell></TableRow>}
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.offer_name}</TableCell>
                  <TableCell>{o.project_name || "—"}</TableCell>
                  <TableCell>{o.offer_type}</TableCell>
                  <TableCell className="whitespace-nowrap">{o.offer_date}{o.po_date && <div className="text-xs text-muted-foreground">PO: {o.po_date}</div>}</TableCell>
                  <TableCell>{o.customer_name}</TableCell>
                  <TableCell>{o.end_customer_name}</TableCell>
                  <TableCell className="text-xs"><div className="flex flex-col gap-1">{o.battery_models.map((b, i) => <span key={i} className="whitespace-nowrap">{b.model} ×{b.quantity}</span>)}</div></TableCell>
                  <TableCell className="text-right">{totalQty(o)}</TableCell>
                  <TableCell>{o.country}</TableCell><TableCell>{o.region}</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold">{eur(o.total_amount)}</TableCell>
                  <TableCell><Badge variant={o.status === "perso" ? "destructive" : o.status === "Offerta inviata" ? "outline" : o.status === "LOI" ? "secondary" : "default"}>{o.status}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    <Button variant="ghost" size="icon" aria-label="PDF" disabled={!o.pdf_url} onClick={() => o.pdf_url && openPdf(o.pdf_url).catch((e) => toast.error(e.message))}><FileText className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" aria-label="Modifica" onClick={() => setEditing(o)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" aria-label="Elimina" onClick={() => setDeleting(o)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader><DialogTitle>Modifica offerta</DialogTitle></DialogHeader>
          {editing && <OfferForm key={editing.id} offer={editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare l'offerta?</AlertDialogTitle>
            <AlertDialogDescription>"{deleting?.offer_name}" verrà eliminata definitivamente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Filter({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-44"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}: tutti</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
