-- Create trigger to auto-create profiles when users sign up
-- This runs after a user is created in auth.users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from user metadata
  user_role := COALESCE(new.raw_user_meta_data ->> 'role', 'buyer');

  -- Insert into users table
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, user_role)
  ON CONFLICT (id) DO NOTHING;

  -- Create profile based on role
  IF user_role = 'franchisor' THEN
    INSERT INTO public.franchisor_profiles (
      user_id,
      company_name,
      contact_name,
      email,
      phone
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data ->> 'company_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'name', ''),
      new.email,
      COALESCE(new.raw_user_meta_data ->> 'phone', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
    
  ELSIF user_role = 'buyer' THEN
    INSERT INTO public.buyer_profiles (
      user_id,
      first_name,
      last_name,
      email,
      phone
    )
    VALUES (
      new.id,
      COALESCE(split_part(new.raw_user_meta_data ->> 'name', ' ', 1), ''),
      COALESCE(split_part(new.raw_user_meta_data ->> 'name', ' ', 2), ''),
      new.email,
      COALESCE(new.raw_user_meta_data ->> 'phone', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
    
  ELSIF user_role = 'lender' THEN
    INSERT INTO public.lender_profiles (
      user_id,
      company_name,
      contact_name,
      email,
      phone
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data ->> 'company_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'name', ''),
      new.email,
      COALESCE(new.raw_user_meta_data ->> 'phone', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
