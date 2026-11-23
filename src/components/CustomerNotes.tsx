import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AttachmentInput } from "@/components/AttachmentInput";
import { saveCustomerNote, type CustomerNote } from "@/lib/customer-notes";
import { uploadAttachment, openAttachment } from "@/lib/attachments";

export function CustomerNotes({ customerId, notes }: { customerId: string; notes: CustomerNote[] }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<CustomerNote | null>(null);
  const [deleting, setDeleting] = useState<CustomerNote | null>(null);
  const [busy, setBusy] = useState(false);
  async function removeNote() {
    if (!deleting || busy) return;
    setBusy(true);
    try {
      await saveCustomerNote(customerId, deleting, true);
      await qc.invalidateQueries({ queryKey: ["customers"] });
      setDeleting(null);
      toast.success("Nota eliminata");
    } catch { toast.error("Impossibile eliminare la nota"); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4" aria-label="Note cliente">
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Note</h2>
      <Button onClick={() => setEditing({ id: crypto.randomUUID(), note_date: format(new Date(), "yyyy-MM-dd"), title: "", body: "" })}><Plus className="h-4 w-4" />Aggiungi nota</Button>
    </div>
    {notes.length === 0 && <p className="text-sm text-muted-foreground">Nessuna nota.</p>}
    {notes.map((note) => <article key={note.id} className="rounded-md border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><time className="text-xs text-muted-foreground">{note.note_date}</time><h3 className="break-words font-semibold">{note.title}</h3></div>
        <div className="flex shrink-0">
          <Button variant="ghost" size="icon" title="Modifica nota" aria-label={`Modifica nota ${note.title}`} onClick={() => setEditing(note)}><Pencil className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" title="Elimina nota" aria-label={`Elimina nota ${note.title}`} onClick={() => setDeleting(note)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm">{note.body}</p>
      {note.attachment_url && <Button variant="outline" size="sm" className="mt-3 max-w-full" onClick={() => note.attachment_url && openAttachment(note.attachment_url).catch(() => toast.error("Impossibile aprire l'allegato"))}><Download className="h-4 w-4 shrink-0" /><span className="truncate">{note.attachment_name || "Apri allegato"}</span></Button>}
    </article>)}
    <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{notes.some((n) => n.id === editing?.id) ? "Modifica nota" : "Nuova nota"}</DialogTitle><DialogDescription className="sr-only">Comunicazione cliente</DialogDescription></DialogHeader>
        {editing && <NoteForm key={editing.id} customerId={customerId} initial={editing} onDone={() => setEditing(null)} />}
      </DialogContent>
    </Dialog>
    <AlertDialog open={!!deleting} onOpenChange={(open) => { if (!open && !busy) setDeleting(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Eliminare la nota?</AlertDialogTitle><AlertDialogDescription>La nota “{deleting?.title}” verrà rimossa. Il cliente e le sue offerte restano invariati.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel disabled={busy}>Annulla</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void removeNote(); }}>Elimina</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </section>;
}

function NoteForm({ customerId, initial, onDone }: { customerId: string; initial: CustomerNote; onDone: () => void }) {
  const qc = useQueryClient();
  const [v, setV] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !v.title.trim() || !v.note_date) return;
    setSaving(true);
    try {
      const attachment = file ? { attachment_url: await uploadAttachment(file, "customer-notes"), attachment_name: file.name } : {};
      await saveCustomerNote(customerId, { ...v, title: v.title.trim(), ...attachment });
      await qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Nota salvata");
      onDone();
    } catch { toast.error("Salvataggio non riuscito. Controlla anche l'allegato, se presente."); }
    finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="space-y-4">
    <div className="space-y-1.5"><Label htmlFor="note-date">Data *</Label><Input id="note-date" type="date" required value={v.note_date} onChange={(e) => setV({ ...v, note_date: e.target.value })} /></div>
    <div className="space-y-1.5"><Label htmlFor="note-title">Titolo *</Label><Input id="note-title" required value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} /></div>
    <div className="space-y-1.5"><Label htmlFor="note-body">Testo</Label><Textarea id="note-body" rows={5} value={v.body} onChange={(e) => setV({ ...v, body: e.target.value })} /></div>
    <AttachmentInput id="note-attachment" file={file} existingName={v.attachment_name} onFile={setFile} onRemove={() => { setFile(null); const { attachment_url: _url, attachment_name: _name, ...rest } = v; setV(rest); }} />
    <Button type="submit" disabled={saving}>{saving ? "Salvataggio…" : "Salva nota"}</Button>
  </form>;
}