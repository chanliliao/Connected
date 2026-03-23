-- Fix 1: Role injection — hardcode role to 'user'; never trust client-supplied role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, first_name, last_name, birthday, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    (new.raw_user_meta_data->>'birthday')::date,
    'user'   -- always 'user'; never trust client-supplied role
  );
  RETURN new;
END;
$$;

-- Fix 2: pair_with_code — guard against re-pairing + clear codes after pairing
CREATE OR REPLACE FUNCTION public.pair_with_code(code text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller  profiles%ROWTYPE;
  other   profiles%ROWTYPE;
BEGIN
  SELECT * INTO caller FROM profiles WHERE id = auth.uid();

  -- Reject if caller is already paired
  IF caller.partner_id IS NOT NULL THEN
    RETURN json_build_object('error', 'You are already paired. Unpair first.');
  END IF;

  SELECT * INTO other FROM profiles
    WHERE pairing_code = upper(trim(code)) AND id != auth.uid();

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Code not found');
  END IF;

  IF other.partner_id IS NOT NULL THEN
    RETURN json_build_object('error', 'That person is already paired');
  END IF;

  -- Pair both sides and clear both pairing codes so codes can't be reused
  UPDATE profiles
    SET partner_id   = other.id,
        partner_name = coalesce(other.first_name, other.username, 'Your SO'),
        pairing_code = NULL
    WHERE id = auth.uid();

  UPDATE profiles
    SET partner_id   = auth.uid(),
        partner_name = coalesce(caller.first_name, caller.username, 'Your SO'),
        pairing_code = NULL
    WHERE id = other.id;

  RETURN json_build_object(
    'success',      true,
    'partner_name', coalesce(other.first_name, other.username, 'Your SO'),
    'partner_id',   other.id
  );
END;
$$;
