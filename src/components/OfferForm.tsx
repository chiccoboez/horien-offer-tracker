import { useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerPicker } from "@/components/CustomerPicker";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BATTERY_MODELS, STATUSES, OFFER_TYPES, hasProjectName, uploadPdf, type Offer, type OfferInput } from "@/lib/offers";

const today = () => new Date().toISOString().slice(0, 10);
const empty = (): OfferInput => ({
  offer_name: "", project_name: "", offer_type: "budgetary", is_alert_dismissed: false, offer_date: today(), po_date: null, customer_name: "", end_customer_name: "",
  battery_models: [{ model: "24UP160", quantity: 1 }], total_amount: 0, notes: "",
  country: "", region: "", status: "Offerta inviata", pdf_url: null, exclude_from_metrics: false, validity_date: null,
});

export function OfferForm({ offer, onDone }: { offer?: Offer; onDone?: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState<OfferInput>(() => (offer ? { ...offer } : empty()));
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof OfferInput>(k: K, val: OfferInput[K]) => setV((p) => ({ ...p, [k]: val }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!v.offer_name.trim()) { toast.error("Inserisci il nome dell'offerta"); return; }
    if (!hasProjectName(v.project_name)) { toast.error("Inserisci il nome del progetto"); return; }
    setSaving(true);
    try {
      const pdf_url = file ? await uploadPdf(file) : v.pdf_url;
      const payload = {
        ...v, pdf_url,
        po_date: v.status === "Ordinato" ? v.po_date || null : null,
        battery_models: v.battery_models.filter((b) => b.model && b.quantity > 0),
        total_amount: Number(v.total_amount) || 0,
      };
      const { error } = offer
        ? await supabase.from("offers").update(payload).eq("id", offer.id)
        : await supabase.from("offers").insert(payload);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["offers"] });
      toast.success(offer ? "Offerta aggiornata" : "Offerta salvata");
      if (!offer) { setV(empty()); setFile(null); (e.target as HTMLFormElement).reset(); }
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Salvataggio non riuscito");
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, el: React.ReactNode) => (
    <div className="space-y-1.5"><Label>{label}</Label>{el}</div>
  );

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {field("Nome offerta *", <Input value={v.offer_name} onChange={(e) => set("offer_name", e.target.value)} />)}
        {field("Nome progetto *", <Input required value={v.project_name} onChange={(e) => set("project_name", e.target.value)} />)}
        {field("Tipo offerta", (
          <Select value={v.offer_type} onValueChange={(t) => set("offer_type", t as OfferInput["offer_type"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{OFFER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        ))}
        {field("Data offerta", <Input type="date" required value={v.offer_date} onChange={(e) => set("offer_date", e.target.value)} />)}
        {field("Stato", (
          <Select value={v.status} onValueChange={(s) => set("status", s as OfferInput["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        ))}
        {v.status === "Ordinato" && field("Data ricezione PO", <Input type="date" value={v.po_date ?? ""} onChange={(e) => set("po_date", e.target.value || null)} />)}
        {field("Cliente", <CustomerPicker value={v.customer_name} onChange={(c) => set("customer_name", c)} />)}
        {field("Cliente finale", <Input value={v.end_customer_name} onChange={(e) => set("end_customer_name", e.target.value)} />)}
        {field("Paese", <Input value={v.country} onChange={(e) => set("country", e.target.value)} />)}
        {field("Città / Regione", <Input value={v.region} onChange={(e) => set("region", e.target.value)} />)}
        {field("Validità Offerta", <Input type="date" value={v.validity_date ?? ""} onChange={(e) => set("validity_date", e.target.value || null)} />)}
        {field("Importo totale (€)", <Input type="number" min={0} step="0.01" value={v.total_amount} onChange={(e) => set("total_amount", Number(e.target.value))} />)}
      </div>

      <div className="space-y-2">
        <Label>Modelli batteria</Label>
        {v.battery_models.map((b, i) => (
          <div key={i} className="flex gap-2">
            <Select value={b.model} onValueChange={(m) => set("battery_models", v.battery_models.map((x, j) => (j === i ? { ...x, model: m } : x)))}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{BATTERY_MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" min={1} className="w-28" value={b.quantity}
              onChange={(e) => set("battery_models", v.battery_models.map((x, j) => (j === i ? { ...x, quantity: Number(e.target.value) } : x)))} />
            <Button type="button" variant="ghost" size="icon" aria-label="Rimuovi" onClick={() => set("battery_models", v.battery_models.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => set("battery_models", [...v.battery_models, { model: "24UP160", quantity: 1 }])}>
          <Plus className="h-4 w-4" /> Aggiungi modello
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Switch id="exclude_from_metrics" checked={v.exclude_from_metrics} onCheckedChange={(c) => set("exclude_from_metrics", c)} />
        <Label htmlFor="exclude_from_metrics">Non includere nei calcoli</Label>
      </div>

      {field("Note", <Textarea rows={3} value={v.notes} onChange={(e) => set("notes", e.target.value)} />)}

      <div className="space-y-1.5">
        <Label>PDF offerta</Label>
        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-input bg-muted/40 p-4 text-sm text-muted-foreground hover:bg-muted">
          <Upload className="h-4 w-4 text-primary" />
          {file ? file.name : v.pdf_url ? "PDF già caricato — clicca per sostituirlo" : "Carica un file PDF"}
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? "Salvataggio…" : offer ? "Aggiorna offerta" : "Salva offerta"}
      </Button>
    </form>
  );
}
