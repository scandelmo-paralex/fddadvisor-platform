-- Lead Contact Log Table
-- Tracks all outbound contact from franchisors/team members to leads

CREATE TABLE IF NOT EXISTS lead_contact_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Link to the lead (invitation)
  invitation_id UUID NOT NULL REFERENCES lead_invitations(id) ON DELETE CASCADE,
  
  -- Who sent the contact
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  
  -- Email details
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Recipient info (denormalized for easy display)
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookups by invitation
CREATE INDEX idx_lead_contact_log_invitation ON lead_contact_log(invitation_id);

-- Index for lookups by sender
CREATE INDEX idx_lead_contact_log_sender ON lead_contact_log(sender_user_id);

-- RLS Policies
ALTER TABLE lead_contact_log ENABLE ROW LEVEL SECURITY;

-- Franchisor owners can see all contact logs for their leads
CREATE POLICY "Franchisor owners can view contact logs for their leads"
  ON lead_contact_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lead_invitations li
      JOIN franchisor_profiles fp ON li.franchisor_id = fp.id
      WHERE li.id = lead_contact_log.invitation_id
      AND fp.user_id = auth.uid()
    )
  );

-- Team admins can see all contact logs for their franchisor's leads
CREATE POLICY "Team admins can view contact logs"
  ON lead_contact_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lead_invitations li
      JOIN franchisor_team_members ftm ON li.franchisor_id = ftm.franchisor_id
      WHERE li.id = lead_contact_log.invitation_id
      AND ftm.user_id = auth.uid()
      AND ftm.role = 'admin'
      AND ftm.is_active = true
    )
  );

-- Recruiters can only see contact logs for leads they created OR contacts they sent
CREATE POLICY "Recruiters can view contact logs for their leads"
  ON lead_contact_log FOR SELECT
  USING (
    -- They sent this contact
    sender_user_id = auth.uid()
    OR
    -- Or it's for a lead they created
    EXISTS (
      SELECT 1 FROM lead_invitations li
      JOIN franchisor_team_members ftm ON li.franchisor_id = ftm.franchisor_id
      WHERE li.id = lead_contact_log.invitation_id
      AND li.created_by = auth.uid()
      AND ftm.user_id = auth.uid()
      AND ftm.role = 'recruiter'
      AND ftm.is_active = true
    )
  );

-- Anyone authenticated can insert (we validate in API)
CREATE POLICY "Authenticated users can insert contact logs"
  ON lead_contact_log FOR INSERT
  WITH CHECK (auth.uid() = sender_user_id);
