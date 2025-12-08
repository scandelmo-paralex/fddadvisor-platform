-- FDDHub Staging RLS Policies v7
-- Verified column names from schema

-- Drop ALL existing policies first to avoid conflicts
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Helper function for franchisor buyer access
CREATE OR REPLACE FUNCTION get_franchisor_accessible_buyer_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT l.buyer_id
  FROM leads l
  INNER JOIN franchisor_profiles fp ON fp.id = l.franchisor_id
  WHERE fp.user_id = auth.uid()
    AND l.buyer_id IS NOT NULL
$$;

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE closed_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdd_buyer_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdd_buyer_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdd_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdd_engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdd_franchisescore_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdd_item_page_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdd_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdd_search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdds ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchisor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchisor_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_fdd_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- BUYER_PROFILES POLICIES
-- =====================================================
CREATE POLICY "Franchisors view leads buyer profiles" ON buyer_profiles
  FOR SELECT USING (id IN (SELECT get_franchisor_accessible_buyer_ids()));

CREATE POLICY "Users can insert own buyer profile" ON buyer_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own buyer profile" ON buyer_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own buyer profile" ON buyer_profiles
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- CLOSED_DEALS POLICIES (uses franchisor_id)
-- =====================================================
CREATE POLICY "Franchisors manage own closed deals" ON closed_deals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = closed_deals.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- =====================================================
-- ENGAGEMENT_EVENTS POLICIES
-- =====================================================
CREATE POLICY "Authenticated users can insert engagement events" ON engagement_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own engagement events" ON engagement_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = engagement_events.lead_id
      AND leads.buyer_id = auth.uid()
    )
  );

-- =====================================================
-- FDD_BUYER_CONSENTS POLICIES
-- =====================================================
CREATE POLICY "Users can insert own FDD consent" ON fdd_buyer_consents
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Users can view own FDD consent" ON fdd_buyer_consents
  FOR SELECT USING (buyer_id = auth.uid());

-- =====================================================
-- FDD_BUYER_INVITATIONS POLICIES (uses franchise_id)
-- =====================================================
CREATE POLICY "Buyers accept their invitations" ON fdd_buyer_invitations
  FOR UPDATE USING (
    buyer_email = (SELECT email FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Buyers view their invitations" ON fdd_buyer_invitations
  FOR SELECT USING (
    buyer_email = (SELECT email FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Franchisors manage own invitations" ON fdd_buyer_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_users
      WHERE franchisor_users.user_id = auth.uid()
      AND franchisor_users.franchise_id = fdd_buyer_invitations.franchise_id
    )
  );

-- =====================================================
-- FDD_CHUNKS POLICIES
-- =====================================================
CREATE POLICY "Authenticated users can search FDD chunks" ON fdd_chunks
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- FDD_ENGAGEMENTS POLICIES
-- =====================================================
CREATE POLICY "Buyers can insert own engagements" ON fdd_engagements
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers can update own engagements" ON fdd_engagements
  FOR UPDATE USING (buyer_id = auth.uid());

CREATE POLICY "Buyers can view own engagements" ON fdd_engagements
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Franchisors view engagements for their franchises" ON fdd_engagements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM franchisor_users fu
      JOIN fdds ON fdds.id = fdd_engagements.fdd_id
      WHERE fu.user_id = auth.uid()
      AND fu.franchise_id = fdds.franchise_id
    )
  );

-- =====================================================
-- FDD_FRANCHISESCORE_CONSENTS POLICIES
-- =====================================================
CREATE POLICY "Users can insert own FranchiseScore consent" ON fdd_franchisescore_consents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own FranchiseScore consent" ON fdd_franchisescore_consents
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- FDD_ITEM_PAGE_MAPPINGS POLICIES
-- =====================================================
CREATE POLICY "Authenticated users can view item mappings" ON fdd_item_page_mappings
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- FDD_QUESTION_ANSWERS POLICIES
-- =====================================================
CREATE POLICY "Authenticated users can view cached answers" ON fdd_question_answers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert cached answers" ON fdd_question_answers
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- FDD_SEARCH_QUERIES POLICIES
-- =====================================================
CREATE POLICY "Users can insert own search queries" ON fdd_search_queries
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own search queries" ON fdd_search_queries
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- FDDS POLICIES
-- =====================================================
CREATE POLICY "Anyone can view public FDDs" ON fdds
  FOR SELECT USING (true);

CREATE POLICY "Franchisors can manage own FDDs" ON fdds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_users
      WHERE franchisor_users.user_id = auth.uid()
      AND franchisor_users.franchise_id = fdds.franchise_id
    )
  );

-- =====================================================
-- FRANCHISES POLICIES (uses franchisor_id)
-- =====================================================
CREATE POLICY "Anyone can view franchises" ON franchises
  FOR SELECT USING (true);

CREATE POLICY "Franchisors can manage own franchises" ON franchises
  FOR ALL USING (
    franchisor_id IN (
      SELECT id FROM franchisor_profiles
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FRANCHISOR_PROFILES POLICIES
-- =====================================================
CREATE POLICY "Authenticated users can view franchisor profiles" ON franchisor_profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own franchisor profile" ON franchisor_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own franchisor profile" ON franchisor_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- FRANCHISOR_USERS POLICIES (uses franchise_id)
-- =====================================================
CREATE POLICY "Franchisor admins can manage team" ON franchisor_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_users fu
      WHERE fu.user_id = auth.uid()
      AND fu.franchise_id = franchisor_users.franchise_id
      AND fu.role = 'admin'
    )
  );

CREATE POLICY "Users can view own franchisor associations" ON franchisor_users
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- LEAD_FDD_ACCESS POLICIES (uses franchisor_id AND franchise_id)
-- =====================================================
CREATE POLICY "Buyers view own FDD access" ON lead_fdd_access
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Franchisors manage FDD access" ON lead_fdd_access
  FOR ALL USING (
    franchisor_id IN (
      SELECT id FROM franchisor_profiles
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- LEAD_INVITATIONS POLICIES (uses franchisor_id)
-- =====================================================
CREATE POLICY "Buyers view own invitations" ON lead_invitations
  FOR SELECT USING (
    lead_email = (SELECT email FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Franchisors can delete own invitations" ON lead_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_invitations.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can insert invitations" ON lead_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_invitations.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can view own invitations" ON lead_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_invitations.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- =====================================================
-- LEADS POLICIES (uses franchisor_id)
-- =====================================================
CREATE POLICY "Buyers view own lead records" ON leads
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Franchisors can manage own leads" ON leads
  FOR ALL USING (
    franchisor_id IN (
      SELECT id FROM franchisor_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can view own leads" ON leads
  FOR SELECT USING (
    franchisor_id IN (
      SELECT id FROM franchisor_profiles
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- LENDER_PROFILES POLICIES
-- =====================================================
CREATE POLICY "Users can insert own lender profile" ON lender_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own lender profile" ON lender_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own lender profile" ON lender_profiles
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- =====================================================
-- SHARED_ACCESS POLICIES (uses franchisor_id)
-- =====================================================
CREATE POLICY "Franchisors can manage shared access" ON shared_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = shared_access.franchisor_id
      AND franchisor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Shared users can view their access" ON shared_access
  FOR SELECT USING (
    shared_with_email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- =====================================================
-- USERS POLICIES
-- =====================================================
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (id = auth.uid());

-- =====================================================
-- USER_NOTES POLICIES
-- =====================================================
CREATE POLICY "Users can delete own notes" ON user_notes
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notes" ON user_notes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notes" ON user_notes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own notes" ON user_notes
  FOR SELECT USING (user_id = auth.uid());
