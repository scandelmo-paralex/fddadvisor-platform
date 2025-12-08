-- Row Level Security Policies v2

-- Enable RLS on all tables
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchisor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_approvals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- BUYER PROFILES POLICIES
-- ============================================================================

CREATE POLICY "Buyers can view own profile"
  ON buyer_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Buyers can insert own profile"
  ON buyer_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Buyers can update own profile"
  ON buyer_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FRANCHISOR PROFILES POLICIES
-- ============================================================================

CREATE POLICY "Franchisors can view own profile"
  ON franchisor_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Franchisors can insert own profile"
  ON franchisor_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Franchisors can update own profile"
  ON franchisor_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- LENDER PROFILES POLICIES
-- ============================================================================

CREATE POLICY "Lenders can view own profile"
  ON lender_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Lenders can insert own profile"
  ON lender_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Lenders can update own profile"
  ON lender_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FRANCHISES POLICIES
-- ============================================================================

CREATE POLICY "Anyone can view active franchises"
  ON franchises FOR SELECT
  USING (is_active = true);

CREATE POLICY "Franchisors can manage own franchises"
  ON franchises FOR ALL
  USING (
    franchisor_id IN (
      SELECT id FROM franchisor_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- LEADS POLICIES
-- ============================================================================

CREATE POLICY "Franchisors can view own leads"
  ON leads FOR SELECT
  USING (
    franchisor_id IN (
      SELECT id FROM franchisor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can manage own leads"
  ON leads FOR ALL
  USING (
    franchisor_id IN (
      SELECT id FROM franchisor_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can view own leads"
  ON leads FOR SELECT
  USING (
    buyer_id IN (
      SELECT id FROM buyer_profiles WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- ENGAGEMENT EVENTS POLICIES
-- ============================================================================

CREATE POLICY "Users can view engagement events for their leads"
  ON engagement_events FOR SELECT
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE 
        franchisor_id IN (SELECT id FROM franchisor_profiles WHERE user_id = auth.uid())
        OR buyer_id IN (SELECT id FROM buyer_profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Users can create engagement events for their leads"
  ON engagement_events FOR INSERT
  WITH CHECK (
    lead_id IN (
      SELECT id FROM leads WHERE 
        franchisor_id IN (SELECT id FROM franchisor_profiles WHERE user_id = auth.uid())
    )
  );

-- ============================================================================
-- PRE-APPROVALS POLICIES
-- ============================================================================

CREATE POLICY "Lenders can manage own pre-approvals"
  ON pre_approvals FOR ALL
  USING (
    lender_id IN (
      SELECT id FROM lender_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can view own pre-approvals"
  ON pre_approvals FOR SELECT
  USING (
    buyer_id IN (
      SELECT id FROM buyer_profiles WHERE user_id = auth.uid()
    )
  );
