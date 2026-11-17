ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS exclude_from_metrics boolean NOT NULL DEFAULT false;
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS validity_date date;