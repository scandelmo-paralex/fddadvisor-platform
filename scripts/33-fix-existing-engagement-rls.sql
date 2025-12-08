-- Fix RLS policies for existing fdd_engagements table
-- This allows anonymous and authenticated tracking to work

-- Drop restrictive policies if they exist
DROP POLICY IF EXISTS "Buyers can insert their own engagements" ON fdd_engagements;
DROP POLICY IF EXISTS "Buyers read their own engagements" ON fdd_engagements;
DROP POLICY IF EXISTS "Franchisors read own engagements" ON fdd_engagements;

-- Create permissive policies for current system
-- Policy 1: Allow anyone (authenticated or anonymous) to insert engagement data
CREATE POLICY "Allow engagement tracking inserts"
ON fdd_engagements
FOR INSERT
WITH CHECK (true);

-- Policy 2: Authenticated users can read their own data
CREATE POLICY "Users read own engagement"
ON fdd_engagements
FOR SELECT
USING (user_id = auth.uid() OR user_id IS NULL);

-- Policy 3: Allow updates to existing engagement records
CREATE POLICY "Allow engagement updates"
ON fdd_engagements
FOR UPDATE
USING (true)
WITH CHECK (true);
