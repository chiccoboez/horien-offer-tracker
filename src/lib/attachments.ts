import { supabase } from "@/integrations/supabase/client";

/** Isolated paths in the existing private bucket; never alters offer files. */
export async function uploadAttachment(file: File, section: "customer-notes" | "projects") {
  const path = `${section}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
  const { error } = await supabase.storage.from("offer-pdfs").upload(path, file, {
    contentType: file.type || "application/octet-stream",
  });
  if (error) throw error;
  return path;
}

export async function openAttachment(path: string) {
  const { data, error } = await supabase.storage.from("offer-pdfs").createSignedUrl(path, 3600);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}