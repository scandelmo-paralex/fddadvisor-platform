-- Bypass email confirmation for development
-- WARNING: Remove this in production! Email confirmation is a security best practice.

-- Create a function to auto-confirm emails on signup
CREATE OR REPLACE FUNCTION public.auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm the email immediately
  NEW.email_confirmed_at = NOW();
  NEW.confirmation_token = NULL;
  NEW.confirmation_sent_at = NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm emails when users sign up
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;
CREATE TRIGGER auto_confirm_email_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_email();

-- Also update existing unconfirmed users (if any)
UPDATE auth.users
SET 
  email_confirmed_at = NOW(),
  confirmation_token = NULL,
  confirmation_sent_at = NULL
WHERE email_confirmed_at IS NULL;

COMMENT ON FUNCTION public.auto_confirm_email() IS 'DEV ONLY: Auto-confirms user emails on signup. Remove in production!';
