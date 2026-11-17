import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCustomer, emptyContact, type CustomerInput } from "@/lib/customers";

export function CustomerForm({ initialName = "", onDone }: { initialName?: string; onDone?: (companyName: string) => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState<CustomerInput>({ company_name: initialName, address: "", contacts: [emptyContact()] });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!v.company_name.trim()) { toast.error("Inserisci il nome dell'azienda"); return; }
    setSaving(true);
    try {
      const c = await createCustomer(v);
      await qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente salvato");
      onDone?.(c.company_name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Salvataggio non riuscito");
    } finally { setSaving(false); }
  }

  const setContact = (i: number, k: keyof CustomerInput["contacts"][number], val: string) =>
    setV((p) => ({ ...p, contacts: p.contacts.map((c, j) => (j === i ? { ...c, [k]: val } : c)) }));

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5"><Label>Ragione sociale *</Label><Input value={v.company_name} onChange={(e) => setV({ ...v, company_name: e.target.value })} /></div>
      <div className="space-y-1.5"><Label>Indirizzo</Label><Textarea rows={2} value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} /></div>
      <div className="space-y-2">
        <Label>Referenti</Label>
        {v.contacts.map((c, i) => (
          <div key={i} className="grid gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <Input placeholder="Nome" value={c.full_name} onChange={(e) => setContact(i, "full_name", e.target.value)} />
            <Input placeholder="Ruolo" value={c.role} onChange={(e) => setContact(i, "role", e.target.value)} />
            <Input placeholder="Email" type="email" value={c.email} onChange={(e) => setContact(i, "email", e.target.value)} />
            <Input placeholder="Telefono" value={c.phone} onChange={(e) => setContact(i, "phone", e.target.value)} />
            <Button type="button" variant="ghost" size="icon" aria-label="Rimuovi referente" onClick={() => setV({ ...v, contacts: v.contacts.filter((_, j) => j !== i) })}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setV({ ...v, contacts: [...v.contacts, emptyContact()] })}>
          <Plus className="h-4 w-4" /> Aggiungi Referente
        </Button>
      </div>
      <Button type="submit" disabled={saving}>{saving ? "Salvataggio…" : "Salva cliente"}</Button>
    </form>
  );
}
