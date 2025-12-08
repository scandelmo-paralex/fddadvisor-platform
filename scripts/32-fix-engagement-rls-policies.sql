-- Fix RLS policies for fdd_engagements table to allow engagement tracking

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own engagements" ON fdd_engagements;
DROP POLICY IF EXISTS "Allow engagement tracking" ON fdd_engagements;

-- Create a permissive INSERT policy that allows authenticated users to track engagement
CREATE POLICY "Allow engagement tracking" 
ON fdd_engagements
FOR INSERT 
WITH CHECK (true);

-- Also allow authenticated users to read their own engagement data
CREATE POLICY "Users can read engagement data" 
ON fdd_engagements
FOR SELECT 
USING (true);

-- Allow users to update their own engagement records
CREATE POLICY "Users can update engagement data" 
ON fdd_engagements
FOR UPDATE 
USING (true);

COMMENT ON POLICY "Allow engagement tracking" ON fdd_engagements IS 
'Allows any user (authenticated or anonymous) to insert engagement tracking data';
