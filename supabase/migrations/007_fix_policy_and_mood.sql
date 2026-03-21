-- Add mood column if it didn't get created
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mood text NOT NULL DEFAULT 'peace';

-- Helper function that reads partner_id without triggering RLS (SECURITY DEFINER bypasses row-level policies)
CREATE OR REPLACE FUNCTION public.get_my_partner_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT partner_id FROM profiles WHERE id = auth.uid();
$$;

-- Drop the broken recursive policy
DROP POLICY IF EXISTS "select partner profile" ON public.profiles;
DROP POLICY IF EXISTS "select own profile" ON public.profiles;

-- Recreate with non-recursive check via the helper function
CREATE POLICY "select own or partner profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR id = public.get_my_partner_id()
  );
