-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE franchisor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE qualification_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE closed_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- FRANCHISOR PROFILES
-- =============================================

-- Franchisors can read and update their own profile
CREATE POLICY "Franchisors can view own profile"
  ON franchisor_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Franchisors can update own profile"
  ON franchisor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Franchisors can insert own profile"
  ON franchisor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- BUYER PROFILES
-- =============================================

-- Buyers can read and update their own profile
CREATE POLICY "Buyers can view own profile"
  ON buyer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Buyers can update own profile"
  ON buyer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Buyers can insert own profile"
  ON buyer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Franchisors can view buyer profiles for their leads
CREATE POLICY "Franchisors can view buyer profiles for their leads"
  ON buyer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l
      JOIN franchisor_profiles fp ON l.franchisor_id = fp.id
      WHERE l.buyer_profile_id = buyer_profiles.id
      AND fp.user_id = auth.uid()
    )
  );

-- Lenders can view buyer profiles for pre-approval requests
CREATE POLICY "Lenders can view buyer profiles for pre-approvals"
  ON buyer_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM pre_approval_requests par
      JOIN lender_profiles lp ON par.lender_id = lp.id
      WHERE par.buyer_profile_id = buyer_profiles.id
      AND lp.user_id = auth.uid()
    )
  );

-- =============================================
-- LENDER PROFILES
-- =============================================

-- Lenders can read and update their own profile
CREATE POLICY "Lenders can view own profile"
  ON lender_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Lenders can update own profile"
  ON lender_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Lenders can insert own profile"
  ON lender_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Buyers can view all lender profiles (to request pre-approval)
CREATE POLICY "Buyers can view all lender profiles"
  ON lender_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- FRANCHISES
-- =============================================

-- Franchisors can manage their own franchises
CREATE POLICY "Franchisors can view own franchises"
  ON franchises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE id = franchises.franchisor_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can insert own franchises"
  ON franchises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE id = franchises.franchisor_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can update own franchises"
  ON franchises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE id = franchises.franchisor_id
      AND user_id = auth.uid()
    )
  );

-- Buyers can view franchises they have leads for
CREATE POLICY "Buyers can view franchises for their leads"
  ON franchises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l
      JOIN buyer_profiles bp ON l.buyer_profile_id = bp.id
      WHERE l.franchise_id = franchises.id
      AND bp.user_id = auth.uid()
    )
  );

-- =============================================
-- LEADS
-- =============================================

-- Franchisors can manage their own leads
CREATE POLICY "Franchisors can view own leads"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE id = leads.franchisor_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can insert own leads"
  ON leads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE id = leads.franchisor_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can update own leads"
  ON leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE id = leads.franchisor_id
      AND user_id = auth.uid()
    )
  );

-- Buyers can view and update their own leads
CREATE POLICY "Buyers can view own leads"
  ON leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE id = leads.buyer_profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can update own leads"
  ON leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE id = leads.buyer_profile_id
      AND user_id = auth.uid()
    )
  );

-- =============================================
-- ENGAGEMENT EVENTS
-- =============================================

-- Buyers can insert their own engagement events
CREATE POLICY "Buyers can insert own engagement events"
  ON engagement_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads l
      JOIN buyer_profiles bp ON l.buyer_profile_id = bp.id
      WHERE l.id = engagement_events.lead_id
      AND bp.user_id = auth.uid()
    )
  );

-- Franchisors can view engagement events for their leads
CREATE POLICY "Franchisors can view engagement events for their leads"
  ON engagement_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l
      JOIN franchisor_profiles fp ON l.franchisor_id = fp.id
      WHERE l.id = engagement_events.lead_id
      AND fp.user_id = auth.uid()
    )
  );

-- Buyers can view their own engagement events
CREATE POLICY "Buyers can view own engagement events"
  ON engagement_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l
      JOIN buyer_profiles bp ON l.buyer_profile_id = bp.id
      WHERE l.id = engagement_events.lead_id
      AND bp.user_id = auth.uid()
    )
  );

-- =============================================
-- QUALIFICATION RESPONSES
-- =============================================

-- Buyers can insert their own qualification responses
CREATE POLICY "Buyers can insert own qualification responses"
  ON qualification_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM leads l
      JOIN buyer_profiles bp ON l.buyer_profile_id = bp.id
      WHERE l.id = qualification_responses.lead_id
      AND bp.user_id = auth.uid()
    )
  );

-- Franchisors can view qualification responses for their leads
CREATE POLICY "Franchisors can view qualification responses for their leads"
  ON qualification_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l
      JOIN franchisor_profiles fp ON l.franchisor_id = fp.id
      WHERE l.id = qualification_responses.lead_id
      AND fp.user_id = auth.uid()
    )
  );

-- =============================================
-- PRE-APPROVAL REQUESTS
-- =============================================

-- Buyers can create and view their own pre-approval requests
CREATE POLICY "Buyers can insert own pre-approval requests"
  ON pre_approval_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE id = pre_approval_requests.buyer_profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can view own pre-approval requests"
  ON pre_approval_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE id = pre_approval_requests.buyer_profile_id
      AND user_id = auth.uid()
    )
  );

-- Lenders can view and update their pre-approval requests
CREATE POLICY "Lenders can view own pre-approval requests"
  ON pre_approval_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM lender_profiles
      WHERE id = pre_approval_requests.lender_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Lenders can update own pre-approval requests"
  ON pre_approval_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM lender_profiles
      WHERE id = pre_approval_requests.lender_id
      AND user_id = auth.uid()
    )
  );

-- Franchisors can view pre-approval requests for their leads
CREATE POLICY "Franchisors can view pre-approvals for their leads"
  ON pre_approval_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads l
      JOIN franchisor_profiles fp ON l.franchisor_id = fp.id
      WHERE l.id = pre_approval_requests.lead_id
      AND fp.user_id = auth.uid()
    )
  );

-- =============================================
-- CLOSED DEALS
-- =============================================

-- Franchisors can view their own closed deals
CREATE POLICY "Franchisors can view own closed deals"
  ON closed_deals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE id = closed_deals.franchisor_id
      AND user_id = auth.uid()
    )
  );

-- Franchisors can insert their own closed deals
CREATE POLICY "Franchisors can insert own closed deals"
  ON closed_deals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE id = closed_deals.franchisor_id
      AND user_id = auth.uid()
    )
  );

-- =============================================
-- NOTES
-- =============================================

-- Buyers can manage their own notes
CREATE POLICY "Buyers can view own notes"
  ON notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE id = notes.buyer_profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE id = notes.buyer_profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can update own notes"
  ON notes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE id = notes.buyer_profile_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can delete own notes"
  ON notes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM buyer_profiles
      WHERE id = notes.buyer_profile_id
      AND user_id = auth.uid()
    )
  );
