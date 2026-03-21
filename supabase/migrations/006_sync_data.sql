-- Fix 2: Partner Timezone — update caller's tz and push to partner's partner_tz cache
CREATE OR REPLACE FUNCTION public.update_user_tz(new_tz text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE partner_uid uuid;
BEGIN
  UPDATE profiles SET user_tz = new_tz WHERE id = auth.uid();
  SELECT partner_id INTO partner_uid FROM profiles WHERE id = auth.uid();
  IF partner_uid IS NOT NULL THEN
    UPDATE profiles SET partner_tz = new_tz WHERE id = partner_uid;
  END IF;
END;
$$;

-- Fix 2: Seed partner_tz on both sides when pairing
CREATE OR REPLACE FUNCTION public.pair_with_code(code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  other profiles%ROWTYPE;
BEGIN
  SELECT * INTO other FROM profiles
    WHERE pairing_code = upper(trim(code)) AND id != auth.uid();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Code not found');
  END IF;

  IF other.partner_id IS NOT NULL THEN
    RETURN json_build_object('error', 'That person is already paired');
  END IF;

  -- Pair both sides, seeding partner_tz caches
  UPDATE profiles
    SET partner_id   = other.id,
        partner_name = coalesce(other.first_name, other.username, 'Your SO'),
        partner_tz   = other.user_tz
    WHERE id = auth.uid();

  UPDATE profiles
    SET partner_id   = auth.uid(),
        partner_name = (SELECT coalesce(first_name, username, 'Your SO') FROM profiles WHERE id = auth.uid()),
        partner_tz   = (SELECT user_tz FROM profiles WHERE id = auth.uid())
    WHERE id = other.id;

  RETURN json_build_object(
    'success',      true,
    'partner_name', coalesce(other.first_name, other.username, 'Your SO'),
    'partner_id',   other.id
  );
END;
$$;

-- Fix 3: Special Dates — shared & persisted
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS special_dates jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE OR REPLACE FUNCTION public.save_special_dates(dates jsonb)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE partner_uid uuid;
BEGIN
  UPDATE profiles SET special_dates = dates WHERE id = auth.uid();
  SELECT partner_id INTO partner_uid FROM profiles WHERE id = auth.uid();
  IF partner_uid IS NOT NULL THEN
    UPDATE profiles SET special_dates = dates WHERE id = partner_uid;
  END IF;
END;
$$;

-- Fix 4: Mood — persisted column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mood text NOT NULL DEFAULT 'peace';

-- Fix 4: Allow users to read their own OR their partner's profile
DROP POLICY IF EXISTS "select own profile" ON public.profiles;

CREATE POLICY "select partner profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR id = (SELECT partner_id FROM profiles WHERE id = auth.uid())
  );
