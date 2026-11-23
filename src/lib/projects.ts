import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export const PROJECT_STATUSES = ["FEED", "RFQ", "Completato"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type Project = Omit<Tables<"projects">, "involved_companies" | "status"> & { involved_companies: string[]; status: ProjectStatus };
export type ProjectInput = Omit<Project, "id" | "created_at">;

export function projectPayload(input: ProjectInput): ProjectInput {
  return { ...input, project_name: input.project_name.trim(), involved_companies: input.involved_companies.map((n) => n.trim()).filter(Boolean),
    winning_company: input.status === "Completato" ? input.winning_company?.trim() || null : null };
}

export function filterProjects(projects: Project[], search: string, status: string) {
  const query = search.toLowerCase();
  return projects.filter((p) => (status === "all" || p.status === status) &&
    [p.project_name, p.end_customer_name, p.country, ...p.involved_companies].some((s) => s.toLowerCase().includes(query)));
}

export const projectsQuery = queryOptions({
  queryKey: ["projects"],
  queryFn: async (): Promise<Project[]> => {
    const { data, error } = await supabase.from("projects").select("*").order("start_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((p) => ({ ...p, status: p.status as ProjectStatus,
      involved_companies: Array.isArray(p.involved_companies) ? p.involved_companies.filter((n): n is string => typeof n === "string") : [] }));
  },
});

export async function saveProject(input: ProjectInput, id?: string) {
  const payload = projectPayload(input);
  const result = id ? await supabase.from("projects").update(payload).eq("id", id).select().single() : await supabase.from("projects").insert(payload).select().single();
  if (result.error) throw result.error;
  return result.data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}