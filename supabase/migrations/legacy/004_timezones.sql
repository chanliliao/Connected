ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS user_tz text,
  ADD COLUMN IF NOT EXISTS partner_tz text;
