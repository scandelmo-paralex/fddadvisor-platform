-- Reset password for scandelmo@gmail.com
-- Run this in the Supabase SQL Editor

-- This will send a password reset email to the user
SELECT auth.send_password_reset_email('scandelmo@gmail.com');

-- Alternatively, if you want to set a specific password directly,
-- you'll need to use the Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Find scandelmo@gmail.com
-- 3. Click the three dots (...)
-- 4. Select "Send Password Reset Email"
-- 
-- Or to manually set a password:
-- 1. Click the three dots (...)
-- 2. Select "Reset Password"
-- 3. Enter a new password
