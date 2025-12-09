-- =============================================
-- FIX FRANCHISOR PROFILE UPDATE RLS POLICY
-- Run this in Supabase SQL Editor
-- =============================================

-- First, check if the policy exists
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'franchisor_profiles';

-- Drop and recreate the UPDATE policy to ensure it's correct
DROP POLICY IF EXISTS "Franchisors can update own profile" ON franchisor_profiles;

CREATE POLICY "Franchisors can update own profile"
  ON franchisor_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify the policy was created
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'franchisor_profiles';

-- Optional: Test by checking if a specific user can update
-- Replace 'your-user-id-here' with an actual user_id from the table
/*
SELECT * FROM franchisor_profiles 
WHERE user_id = 'your-user-id-here';
*/
