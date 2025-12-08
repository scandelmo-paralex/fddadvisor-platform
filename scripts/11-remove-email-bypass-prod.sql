-- Remove email confirmation bypass for production
-- Run this script before deploying to production

-- Drop the auto-confirm trigger
DROP TRIGGER IF EXISTS auto_confirm_email_trigger ON auth.users;

-- Drop the auto-confirm function
DROP FUNCTION IF EXISTS public.auto_confirm_email();

-- Note: This will restore Supabase's default email confirmation requirement
-- Users will need to confirm their email via the confirmation link sent to their inbox
