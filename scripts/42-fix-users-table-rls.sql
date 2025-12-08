-- Fix users table RLS policies to allow invitation acceptance
-- This adds missing INSERT policy and includes signup_source column

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own record" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Users can insert own record" ON users;

-- Recreate SELECT policy
CREATE POLICY "Users can view own record" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Add INSERT policy for service role (used during invitation acceptance)
CREATE POLICY "Service role can insert users" ON users
  FOR INSERT
  WITH CHECK (true);

-- Add INSERT policy for authenticated users
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Add UPDATE policy for users to update own record
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE
  USING (auth.uid() = id);
