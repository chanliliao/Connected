-- Add pairing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pairing_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS partner_id   uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_name text;

-- Pair two users by code. Caller is the requesting user.
CREATE OR REPLACE FUNCTION public.pair_with_code(code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  other profiles%ROWTYPE;
BEGIN
  -- Find the profile matching the supplied code (not our own)
  SELECT * INTO other FROM profiles
    WHERE pairing_code = upper(trim(code)) AND id != auth.uid();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Code not found');
  END IF;

  IF other.partner_id IS NOT NULL THEN
    RETURN json_build_object('error', 'That person is already paired');
  END IF;

  -- Pair both sides
  UPDATE profiles
    SET partner_id   = other.id,
        partner_name = coalesce(other.first_name, other.username, 'Your SO')
    WHERE id = auth.uid();

  UPDATE profiles
    SET partner_id   = auth.uid(),
        partner_name = (SELECT coalesce(first_name, username, 'Your SO') FROM profiles WHERE id = auth.uid())
    WHERE id = other.id;

  RETURN json_build_object(
    'success',      true,
    'partner_name', coalesce(other.first_name, other.username, 'Your SO'),
    'partner_id',   other.id
  );
END;
$$;

-- Unpair both sides
CREATE OR REPLACE FUNCTION public.unpair_account()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE profiles SET partner_id = NULL, partner_name = NULL
    WHERE id = (SELECT partner_id FROM profiles WHERE id = auth.uid());
  UPDATE profiles SET partner_id = NULL, partner_name = NULL
    WHERE id = auth.uid();
END;
$$;
