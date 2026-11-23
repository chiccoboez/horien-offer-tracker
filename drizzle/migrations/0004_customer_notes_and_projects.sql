ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes_history jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE TABLE public.projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 created_at timestamptz NOT NULL DEFAULT now(),
 start_date date NOT NULL DEFAULT CURRENT_DATE,
 project_name text NOT NULL,
 end_customer_name text NOT NULL DEFAULT '',
 involved_companies jsonb NOT NULL DEFAULT '[]'::jsonb,
 country text NOT NULL DEFAULT '',
 specifications_text text NOT NULL DEFAULT '',
 specifications_file_url text,
 specifications_file_name text,
 notes text NOT NULL DEFAULT '',
 status text NOT NULL DEFAULT 'FEED' CONSTRAINT projects_status_values CHECK (status IN ('FEED', 'RFQ', 'Completato')),
 winning_company text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects open access" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.save_customer_note(customer_id uuid, note jsonb, remove_note boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
 IF jsonb_typeof(note) IS DISTINCT FROM 'object' OR coalesce(note->>'id', '') = '' THEN
  RAISE EXCEPTION 'Note ID required';
 END IF;
 IF NOT remove_note AND (coalesce(note->>'title', '') = '' OR coalesce(note->>'note_date', '') = '') THEN
  RAISE EXCEPTION 'Note title and date required';
 END IF;
 UPDATE public.customers c SET notes_history =
  coalesce((SELECT jsonb_agg(n) FROM jsonb_array_elements(c.notes_history) n WHERE n->>'id' IS DISTINCT FROM note->>'id'), '[]'::jsonb)
  || CASE WHEN remove_note THEN '[]'::jsonb ELSE jsonb_build_array(note) END
 WHERE c.id = customer_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Customer not found'; END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.save_customer_note(uuid, jsonb, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_customer_note(uuid, jsonb, boolean) TO anon, authenticated, service_role;