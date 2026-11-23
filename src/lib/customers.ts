import { useEffect } from "react";
import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { readCustomerNotes, type CustomerNote } from "@/lib/customer-notes";

export type Contact = { full_name: string; role: string; email: string; phone: string };
export type Customer = { id: string; company_name: string; address: string; contacts: Contact[]; created_at: string; notes_history: CustomerNote[] };
export type CustomerInput = Omit<Customer, "id" | "created_at" | "notes_history">;

export const emptyContact = (): Contact => ({ full_name: "", role: "", email: "", phone: "" });

/** Drops contact rows where every field is blank. */
export const cleanContacts = (contacts: Contact[]) =>
  contacts.map((c) => ({ full_name: c.full_name.trim(), role: c.role.trim(), email: c.email.trim(), phone: c.phone.trim() }))
    .filter((c) => c.full_name || c.role || c.email || c.phone);

/** Offers linked by exact customer_name text, newest offer_date first. */
export const customerOffers = <T extends { customer_name: string; offer_date: string }>(offers: T[], companyName: string) =>
  offers.filter((o) => o.customer_name === companyName).sort((a, b) => b.offer_date.localeCompare(a.offer_date));

export const customersQuery = queryOptions({
  queryKey: ["customers"],
  queryFn: async (): Promise<Customer[]> => {
    const { data, error } = await supabase.from("customers").select("*").order("company_name");
    if (error) throw error;
    return (data ?? []).map((c) => ({ ...c, contacts: (Array.isArray(c.contacts) ? c.contacts : []) as Contact[], notes_history: readCustomerNotes(c.notes_history) }));
  },
});

export async function createCustomer(input: CustomerInput) {
  const { data, error } = await supabase.from("customers")
    .insert({ ...input, company_name: input.company_name.trim(), contacts: cleanContacts(input.contacts) })
    .select().single();
  if (error) throw error.code === "23505" ? new Error("Esiste già un cliente con questo nome") : error;
  return data;
}

export async function updateCustomer(id: string, input: CustomerInput) {
  const { data, error } = await supabase.from("customers")
    .update({ ...input, company_name: input.company_name.trim(), contacts: cleanContacts(input.contacts) })
    .eq("id", id).select().single();
  if (error) throw error.code === "23505" ? new Error("Esiste già un cliente con questo nome") : error;
  return data;
}

/** Deletes only the customer record; offers keep their customer_name text. */
export async function deleteCustomer(id: string) {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) throw error;
}

export function useCustomersRealtime() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase.channel(`customers-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => qc.invalidateQueries({ queryKey: ["customers"] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
}
