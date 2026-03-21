-- Add countdown_dates column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS countdown_dates jsonb NOT NULL DEFAULT '[]'::jsonb;

-- RPC: save caller's countdown dates
CREATE OR REPLACE FUNCTION public.save_countdown_dates(dates jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET countdown_dates = dates WHERE id = auth.uid();
END;
$$;
