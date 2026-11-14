ALTER TABLE public.offers
  ADD COLUMN project_name text NOT NULL DEFAULT '',
  ADD COLUMN offer_type text NOT NULL DEFAULT 'budgetary',
  ADD COLUMN is_alert_dismissed boolean NOT NULL DEFAULT false;

ALTER TABLE public.offers DROP CONSTRAINT IF EXISTS offers_status_check;
UPDATE public.offers SET status = CASE status
  WHEN 'quoted' THEN 'Offerta inviata'
  WHEN 'PO received' THEN 'Ordinato'
  WHEN 'lost' THEN 'perso'
  ELSE status END;
ALTER TABLE public.offers ALTER COLUMN status SET DEFAULT 'Offerta inviata';
ALTER TABLE public.offers ADD CONSTRAINT offers_offer_type_values CHECK (offer_type IN ('budgetary', 'official RFQ'));
ALTER TABLE public.offers ADD CONSTRAINT offers_status_values CHECK (status IN ('Offerta inviata', 'LOI', 'Ordinato', 'perso'));

CREATE OR REPLACE FUNCTION public.normalize_offer_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.status := CASE NEW.status
    WHEN 'quoted' THEN 'Offerta inviata'
    WHEN 'PO received' THEN 'Ordinato'
    WHEN 'lost' THEN 'perso'
    ELSE NEW.status END;
  RETURN NEW;
END;
$$;
CREATE TRIGGER normalize_offer_status_before_write
BEFORE INSERT OR UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.normalize_offer_status();
COMMENT ON COLUMN public.offers.project_name IS 'Exact project name used for dashboard deduplication. Legacy offers stay unnamed until edited.';
COMMENT ON COLUMN public.offers.offer_type IS 'Offer category; legacy offers default to budgetary.';