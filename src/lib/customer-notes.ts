import type { Json } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type CustomerNote = {
  id: string;
  note_date: string;
  title: string;
  body: string;
  attachment_url?: string;
  attachment_name?: string;
};

export function readCustomerNotes(value: Json): CustomerNote[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((n) => {
    if (!n || typeof n !== "object" || Array.isArray(n) || typeof n['id'] !== "string" || typeof n['note_date'] !== "string" || typeof n['title'] !== "string") return [];
    return [{ id: n['id'], note_date: n['note_date'], title: n['title'], body: typeof n['body'] === "string" ? n['body'] : "",
      ...(typeof n['attachment_url'] === "string" ? { attachment_url: n['attachment_url'] } : {}),
      ...(typeof n['attachment_name'] === "string" ? { attachment_name: n['attachment_name'] } : {}),
    }];
  }).sort((a, b) => b.note_date.localeCompare(a.note_date));
}

export async function saveCustomerNote(customerId: string, note: CustomerNote, remove = false) {
  const { error } = await supabase.rpc("save_customer_note", { customer_id: customerId, note, remove_note: remove });
  if (error) throw error;
}