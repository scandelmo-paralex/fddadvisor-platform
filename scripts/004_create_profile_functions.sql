-- Create functions to manage profiles (bypasses PostgREST schema cache issues)

-- Function to get or create franchisor profile
CREATE OR REPLACE FUNCTION get_or_create_franchisor_profile(
  p_user_id UUID,
  p_email TEXT,
  p_company_name TEXT DEFAULT 'My Company',
  p_contact_name TEXT DEFAULT 'User',
  p_phone TEXT DEFAULT ''
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT
) AS $$
BEGIN
  -- Try to get existing profile
  RETURN QUERY
  SELECT fp.id, fp.user_id, fp.company_name, fp.contact_name, fp.email, fp.phone
  FROM franchisor_profiles fp
  WHERE fp.user_id = p_user_id;
  
  -- If no profile exists, create one
  IF NOT FOUND THEN
    RETURN QUERY
    INSERT INTO franchisor_profiles (user_id, company_name, contact_name, email, phone)
    VALUES (p_user_id, p_company_name, p_contact_name, p_email, p_phone)
    RETURNING franchisor_profiles.id, franchisor_profiles.user_id, franchisor_profiles.company_name, 
              franchisor_profiles.contact_name, franchisor_profiles.email, franchisor_profiles.phone;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create buyer profile
CREATE OR REPLACE FUNCTION get_or_create_buyer_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT 'User',
  p_phone TEXT DEFAULT ''
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT bp.id, bp.user_id, bp.full_name, bp.email, bp.phone
  FROM buyer_profiles bp
  WHERE bp.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY
    INSERT INTO buyer_profiles (user_id, full_name, email, phone)
    VALUES (p_user_id, p_full_name, p_email, p_phone)
    RETURNING buyer_profiles.id, buyer_profiles.user_id, buyer_profiles.full_name, 
              buyer_profiles.email, buyer_profiles.phone;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create lender profile
CREATE OR REPLACE FUNCTION get_or_create_lender_profile(
  p_user_id UUID,
  p_email TEXT,
  p_company_name TEXT DEFAULT 'My Company',
  p_contact_name TEXT DEFAULT 'User',
  p_phone TEXT DEFAULT ''
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  company_name TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT lp.id, lp.user_id, lp.company_name, lp.contact_name, lp.email, lp.phone
  FROM lender_profiles lp
  WHERE lp.user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY
    INSERT INTO lender_profiles (user_id, company_name, contact_name, email, phone)
    VALUES (p_user_id, p_company_name, p_contact_name, p_email, p_phone)
    RETURNING lender_profiles.id, lender_profiles.user_id, lender_profiles.company_name, 
              lender_profiles.contact_name, lender_profiles.email, lender_profiles.phone;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_franchisor_profile TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_or_create_buyer_profile TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_or_create_lender_profile TO authenticated, anon;
