-- Simple fix for engagement tracking RLS policy
-- This allows engagement data to be tracked for buyers who have FDD access

-- Add RLS policy to allow inserts for users with FDD access
CREATE POLICY "Allow engagement tracking for authorized buyers" 
ON fdd_engagements
FOR INSERT 
WITH CHECK (
  buyer_id IN (
    SELECT buyer_id FROM lead_fdd_access WHERE buyer_id = fdd_engagements.buyer_id
  )
);

-- Also allow updates for their own engagement records
CREATE POLICY "Buyers can update own engagements" 
ON fdd_engagements
FOR UPDATE 
USING (
  buyer_id IN (
    SELECT id FROM buyer_profiles WHERE user_id = auth.uid()
  )
);

-- Allow buyers to read their own engagement data
CREATE POLICY "Buyers can read own engagements" 
ON fdd_engagements
FOR SELECT 
USING (
  buyer_id IN (
    SELECT id FROM buyer_profiles WHERE user_id = auth.uid()
  )
);
