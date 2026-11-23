import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AttachmentInput } from "@/components/AttachmentInput";
import { uploadAttachment } from "@/lib/attachments";
import { PROJECT_STATUSES, saveProject, type Project, type ProjectInput } from "@/lib/projects";

export function ProjectForm({ project, onDone }: { project?: Project; onDone: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState<ProjectInput>(project ? {
    start_date: project.start_date, project_name: project.project_name, end_customer_name: project.end_customer_name,
    involved_companies: [...project.involved_companies], country: project.country, specifications_text: project.specifications_text,
    specifications_file_url: project.specifications_file_url, specifications_file_name: project.specifications_file_name,
    notes: project.notes, status: project.status, winning_company: project.winning_company,
  } : { start_date: format(new Date(), "yyyy-MM-dd"), project_name: "", end_customer_name: "", involved_companies: [""], country: "",
    specifications_text: "", specifications_file_url: null, specifications_file_name: null, notes: "", status: "FEED", winning_company: null });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => setV((p) => ({ ...p, [key]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !v.project_name.trim()) return;
    setSaving(true);
    try {
      const attachment = file ? { specifications_file_url: await uploadAttachment(file, "projects"), specifications_file_name: file.name } : {};
      await saveProject({ ...v, ...attachment }, project?.id);
      await qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success(project ? "Progetto aggiornato" : "Progetto salvato");
      onDone();
    } catch { toast.error("Salvataggio non riuscito. Controlla anche l'allegato, se presente."); }
    finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5"><Label htmlFor="project-name">Nome progetto *</Label><Input id="project-name" required value={v.project_name} onChange={(e) => set("project_name", e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="project-date">Data inizio *</Label><Input id="project-date" type="date" required value={v.start_date} onChange={(e) => set("start_date", e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="project-customer">Cliente Finale</Label><Input id="project-customer" value={v.end_customer_name} onChange={(e) => set("end_customer_name", e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="project-country">Paese</Label><Input id="project-country" value={v.country} onChange={(e) => set("country", e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="project-status">Stato</Label><Select value={v.status} onValueChange={(s) => { if (s === "FEED" || s === "RFQ" || s === "Completato") set("status", s); }}><SelectTrigger id="project-status"><SelectValue /></SelectTrigger><SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
      {v.status === "Completato" && <div className="space-y-1.5"><Label htmlFor="project-winner">Azienda vincitrice</Label><Input id="project-winner" value={v.winning_company ?? ""} onChange={(e) => set("winning_company", e.target.value || null)} /></div>}
    </div>
    <div className="space-y-2"><Label>Aziende coinvolte</Label>
      {v.involved_companies.map((name, i) => <div key={i} className="flex gap-2"><Input aria-label={`Azienda coinvolta ${i + 1}`} value={name} onChange={(e) => set("involved_companies", v.involved_companies.map((n, j) => i === j ? e.target.value : n))} /><Button type="button" variant="ghost" size="icon" title="Rimuovi azienda" aria-label={`Rimuovi azienda ${i + 1}`} onClick={() => set("involved_companies", v.involved_companies.filter((_, j) => i !== j))}><Trash2 className="h-4 w-4" /></Button></div>)}
      <Button type="button" variant="outline" size="sm" onClick={() => set("involved_companies", [...v.involved_companies, ""])}><Plus className="h-4 w-4" />Aggiungi azienda</Button>
    </div>
    <div className="space-y-1.5"><Label htmlFor="project-specifications">Specifiche</Label><Textarea id="project-specifications" rows={4} value={v.specifications_text} onChange={(e) => set("specifications_text", e.target.value)} /></div>
    <AttachmentInput id="project-attachment" file={file} existingName={v.specifications_file_name} onFile={setFile} onRemove={() => { setFile(null); setV((p) => ({ ...p, specifications_file_url: null, specifications_file_name: null })); }} />
    <div className="space-y-1.5"><Label htmlFor="project-notes">Note</Label><Textarea id="project-notes" rows={3} value={v.notes} onChange={(e) => set("notes", e.target.value)} /></div>
    <Button type="submit" disabled={saving}>{saving ? "Salvataggio…" : project ? "Aggiorna progetto" : "Salva progetto"}</Button>
  </form>;
}