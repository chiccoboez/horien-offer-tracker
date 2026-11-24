import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ProjectForm } from "@/components/ProjectForm";
import { PROJECT_STATUSES, projectsQuery, filterProjects, deleteProject, type Project } from "@/lib/projects";
import { openAttachment } from "@/lib/attachments";

export const Route = createFileRoute("/progetti")({
  head: () => ({ meta: [
    { title: "Progetti — HORIEN Offer Tracker" },
    { name: "description", content: "Gestione progetti HORIEN: aziende coinvolte, specifiche e avanzamento da FEED a completamento." },
    { property: "og:title", content: "Progetti — HORIEN Offer Tracker" },
    { property: "og:description", content: "Gestione progetti HORIEN: aziende coinvolte, specifiche e avanzamento da FEED a completamento." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const qc = useQueryClient();
  const { data: projects = [], isLoading, isError, refetch } = useQuery(projectsQuery);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = filterProjects(projects, search, status);
  async function confirmDelete() {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await deleteProject(deleting.id);
      await qc.invalidateQueries({ queryKey: ["projects"] });
      setDeleting(null);
      toast.success("Progetto eliminato");
    } catch { toast.error("Impossibile eliminare il progetto"); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-7xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold">Progetti</h1><Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" />Nuovo progetto</Button></div>
    <div className="flex flex-wrap gap-3">
      <div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input aria-label="Cerca progetti" className="pl-9" placeholder="Cerca progetto, cliente finale, paese, azienda…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44" aria-label="Filtra stato"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tutti gli stati</SelectItem>{PROJECT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
    </div>
    {isError ? <div className="space-y-2"><p className="text-destructive">Impossibile caricare i progetti.</p><Button variant="outline" onClick={() => void refetch()}>Riprova</Button></div> : <Table className="table-fixed text-sm [&_td]:whitespace-normal [&_td]:break-words [&_th]:whitespace-normal">
      <TableHeader><TableRow><TableHead>Progetto</TableHead><TableHead>Cliente Finale</TableHead><TableHead className="w-[12%]">Paese</TableHead><TableHead>Aziende coinvolte</TableHead><TableHead className="w-28">Stato</TableHead><TableHead className="w-28">Data inizio</TableHead><TableHead className="w-28 text-right">Azioni</TableHead></TableRow></TableHeader>
      <TableBody>
        {rows.length === 0 && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">{isLoading ? "Caricamento…" : "Nessun progetto trovato."}</TableCell></TableRow>}
        {rows.map((p) => <TableRow key={p.id}>
          <TableCell className="font-medium">{p.project_name}</TableCell><TableCell>{p.end_customer_name || "—"}</TableCell><TableCell>{p.country || "—"}</TableCell>
          <TableCell><ul className="space-y-1">{p.involved_companies.map((name, i) => <li key={i}>{name}</li>)}</ul>{p.involved_companies.length === 0 && "—"}</TableCell>
          <TableCell><Badge variant={p.status === "Completato" ? "default" : p.status === "RFQ" ? "secondary" : "outline"}>{p.status}</Badge>{p.status === "Completato" && p.winning_company && <p className="mt-1 text-xs text-muted-foreground">{p.winning_company}</p>}</TableCell>
          <TableCell>{p.start_date}</TableCell>
          <TableCell><div className="flex justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Allegato ${p.project_name}`} title={p.specifications_file_name || "Allegato"} disabled={!p.specifications_file_url} onClick={() => p.specifications_file_url && openAttachment(p.specifications_file_url).catch(() => toast.error("Impossibile aprire l'allegato"))}><Download className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Modifica ${p.project_name}`} title="Modifica progetto" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Elimina ${p.project_name}`} title="Elimina progetto" onClick={() => setDeleting(p)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div></TableCell>
        </TableRow>)}
      </TableBody>
    </Table>}
    <Dialog open={creating || !!editing} onOpenChange={(open) => { if (!open) { setCreating(false); setEditing(null); } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{editing ? "Modifica progetto" : "Nuovo progetto"}</DialogTitle><DialogDescription className="sr-only">Dati e specifiche del progetto</DialogDescription></DialogHeader>
        {(creating || editing) && <ProjectForm key={editing?.id || "new"} {...(editing ? { project: editing } : {})} onDone={() => { setCreating(false); setEditing(null); }} />}
      </DialogContent>
    </Dialog>
    <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open && !busy) setDeleting(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminare il progetto?</AlertDialogTitle><AlertDialogDescription>“{deleting?.project_name}” verrà eliminato. I clienti e le offerte restano invariati.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Annulla</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void confirmDelete(); }}>Elimina</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}