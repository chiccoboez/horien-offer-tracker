CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  offer_date DATE NOT NULL DEFAULT CURRENT_DATE,
  po_date DATE,
  customer_name TEXT NOT NULL DEFAULT '',
  end_customer_name TEXT NOT NULL DEFAULT '',
  battery_models JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  region TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'quoted' CHECK (status IN ('quoted','LOI','PO received')),
  pdf_url TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO anon, authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open access" ON public.offers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
CREATE POLICY "offer pdfs read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'offer-pdfs');
CREATE POLICY "offer pdfs write" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'offer-pdfs');
CREATE POLICY "offer pdfs delete" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'offer-pdfs');