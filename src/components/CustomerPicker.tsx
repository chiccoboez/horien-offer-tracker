import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomerForm } from "@/components/CustomerForm";
import { customersQuery } from "@/lib/customers";
import { cn } from "@/lib/utils";

/** Searchable customer select; keeps legacy free-text values selectable. */
export function CustomerPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: customers = [] } = useQuery(customersQuery);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const names = customers.map((c) => c.company_name);
  if (value && !names.includes(value)) names.unshift(value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-label="Cliente" className="w-full justify-between font-normal">
            <span className={cn("truncate", !value && "text-muted-foreground")}>{value || "Seleziona cliente"}</span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-64 p-0" align="start">
          <Command>
            <CommandInput placeholder="Cerca cliente…" value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>Nessun cliente trovato.</CommandEmpty>
              <CommandGroup>
                {names.map((n) => (
                  <CommandItem key={n} value={n} onSelect={() => { onChange(n); setOpen(false); }}>
                    <Check className={cn("h-4 w-4", value === n ? "opacity-100" : "opacity-0")} /> {n}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            <div className="border-t border-border p-1">
              <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => { setOpen(false); setCreating(true); }}>
                <Plus className="h-4 w-4" /> Crea nuovo cliente{search ? `: ${search}` : ""}
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader><DialogTitle>Nuovo cliente</DialogTitle></DialogHeader>
          {creating && <CustomerForm initialName={search} onDone={(n) => { onChange(n); setCreating(false); setSearch(""); }} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
