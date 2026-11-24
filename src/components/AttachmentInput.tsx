import { Paperclip, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AttachmentInput({ id, file, existingName, onFile, onRemove }: {
  id: string; file: File | null; existingName?: string | null;
  onFile: (file: File | null) => void; onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return <div className="space-y-2">
    <Label htmlFor={id} className="flex items-center gap-2"><Paperclip className="h-4 w-4" />Allegato</Label>
    <Input ref={inputRef} id={id} type="file" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    {(file || existingName) && <div className="flex items-center gap-2 text-sm">
      <span className="min-w-0 break-all text-muted-foreground">{file?.name || existingName}</span>
      <Button type="button" variant="ghost" size="icon" aria-label="Rimuovi allegato" title="Rimuovi allegato" onClick={() => { if (inputRef.current) inputRef.current.value = ""; onRemove(); }}><X className="h-4 w-4" /></Button>
    </div>}
  </div>;
}