-- Fix RLS policies on lead_fdd_access to allow service role to grant access

-- Drop existing policies
DROP POLICY IF EXISTS "Buyers can view own FDD access" ON lead_fdd_access;
DROP POLICY IF EXISTS "Franchisors can view FDD access for their franchises" ON lead_fdd_access;
DROP POLICY IF EXISTS "Service role can manage FDD access" ON lead_fdd_access;

-- Recreate SELECT policies
CREATE POLICY "Buyers can view own FDD access" ON lead_fdd_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE buyer_profiles.id = lead_fdd_access.buyer_id
      AND buyer_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can view FDD access for their franchises" ON lead_fdd_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_fdd_access.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- Add INSERT policy for service role (invitation acceptance flow)
CREATE POLICY "Service role can manage FDD access" ON lead_fdd_access
  FOR ALL USING (true) WITH CHECK (true);
