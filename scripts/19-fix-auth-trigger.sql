-- Drop and recreate the trigger to match actual schema and metadata structure
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from user metadata, default to 'buyer' for FDDAdvisor signups
  user_role := COALESCE(new.raw_user_meta_data ->> 'role', 'buyer');

  -- Insert into users table
  INSERT INTO public.users (id, email, role)
  VALUES (new.id, new.email, user_role::user_role)
  ON CONFLICT (id) DO NOTHING;

  -- Create buyer profile for buyer role (default for FDDAdvisor)
  IF user_role = 'buyer' THEN
    INSERT INTO public.buyer_profiles (
      user_id,
      first_name,
      last_name
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'last_name', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
    
  -- Create franchisor profile for franchisor role
  ELSIF user_role = 'franchisor' THEN
    INSERT INTO public.franchisor_profiles (
      user_id,
      company_name,
      primary_contact_name,
      primary_contact_email
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data ->> 'company_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      new.email
    )
    ON CONFLICT (user_id) DO NOTHING;
    
  -- Create lender profile for lender role
  ELSIF user_role = 'lender' THEN
    INSERT INTO public.lender_profiles (
      user_id,
      company_name,
      loan_officer_name,
      loan_officer_email
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data ->> 'company_name', ''),
      COALESCE(new.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
      new.email
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
