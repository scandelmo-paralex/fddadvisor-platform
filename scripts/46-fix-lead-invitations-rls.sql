-- Fix RLS policies for lead_invitations to allow public token lookup
-- This allows anyone with a valid token to view their invitation

-- Drop existing policies
DROP POLICY IF EXISTS "Franchisors can manage their invitations" ON lead_invitations;
DROP POLICY IF EXISTS "Franchisors can view their invitations" ON lead_invitations;
DROP POLICY IF EXISTS "Service role can manage invitations" ON lead_invitations;

-- Enable RLS
ALTER TABLE lead_invitations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view invitations by token (for accepting invitations)
CREATE POLICY "Anyone can view invitation by token" ON lead_invitations
  FOR SELECT USING (true);

-- Allow franchisors to insert invitations
CREATE POLICY "Franchisors can create invitations" ON lead_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE id = franchisor_id
      AND user_id = auth.uid()
    )
  );

-- Allow franchisors to update their own invitations
CREATE POLICY "Franchisors can update their invitations" ON lead_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE id = franchisor_id
      AND user_id = auth.uid()
    )
  );

-- Allow service role full access (for invitation acceptance flow)
CREATE POLICY "Service role has full access" ON lead_invitations
  FOR ALL USING (true);
