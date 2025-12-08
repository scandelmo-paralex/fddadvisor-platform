-- Helper Functions v2

-- Function to create franchisor profile (bypasses RLS for signup)
CREATE OR REPLACE FUNCTION create_franchisor_profile(
  p_user_id UUID,
  p_company_name TEXT,
  p_contact_name TEXT,
  p_email TEXT,
  p_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  INSERT INTO franchisor_profiles (
    user_id,
    company_name,
    contact_name,
    email,
    phone
  )
  VALUES (
    p_user_id,
    p_company_name,
    p_contact_name,
    p_email,
    p_phone
  )
  RETURNING id INTO v_profile_id;
  
  RETURN v_profile_id;
END;
$$;

-- Function to create buyer profile (bypasses RLS for signup)
CREATE OR REPLACE FUNCTION create_buyer_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_location TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  INSERT INTO buyer_profiles (
    user_id,
    full_name,
    email,
    phone,
    location
  )
  VALUES (
    p_user_id,
    p_full_name,
    p_email,
    p_phone,
    p_location
  )
  RETURNING id INTO v_profile_id;
  
  RETURN v_profile_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_franchisor_profile TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_buyer_profile TO authenticated, anon;
