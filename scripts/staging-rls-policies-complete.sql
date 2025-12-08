-- =============================================
-- FDDHub Staging - Complete RLS Policies
-- Run this AFTER user_notes table is created
-- =============================================

-- Helper function for franchisor buyer access
CREATE OR REPLACE FUNCTION get_franchisor_accessible_buyer_ids(franchisor_user_id uuid)
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT l.buyer_id
  FROM leads l
  INNER JOIN franchisor_users fu ON fu.franchise_id = l.franchise_id
  WHERE fu.user_id = franchisor_user_id
    AND l.buyer_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
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
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =============================================
-- BUYER_PROFILES POLICIES
-- =============================================
CREATE POLICY "Buyers can update own profile" ON buyer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Buyers can view own profile" ON buyer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Franchisors can view buyer profiles for their leads" ON buyer_profiles
  FOR SELECT USING (
    id IN (SELECT get_franchisor_accessible_buyer_ids(auth.uid()))
  );

CREATE POLICY "Service role has full access to buyer_profiles" ON buyer_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- CLOSED_DEALS POLICIES
-- =============================================
CREATE POLICY "Authenticated users can insert closed_deals" ON closed_deals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view closed_deals" ON closed_deals
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- ENGAGEMENT_EVENTS POLICIES
-- =============================================
CREATE POLICY "Service role full access" ON engagement_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can insert own events" ON engagement_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own events" ON engagement_events
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- FDD_BUYER_CONSENTS POLICIES
-- =============================================
CREATE POLICY "Buyers can insert own consents" ON fdd_buyer_consents
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can view own consents" ON fdd_buyer_consents
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Service role has full access" ON fdd_buyer_consents
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FDD_BUYER_INVITATIONS POLICIES
-- =============================================
CREATE POLICY "Buyers can view their invitations" ON fdd_buyer_invitations
  FOR SELECT USING (buyer_email = auth.jwt() ->> 'email');

CREATE POLICY "Franchisors can create invitations for their franchises" ON fdd_buyer_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM franchisor_users
      WHERE franchisor_users.user_id = auth.uid()
      AND franchisor_users.franchise_id = fdd_buyer_invitations.franchisor_id
    )
  );

CREATE POLICY "Franchisors can view invitations for their franchises" ON fdd_buyer_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM franchisor_users
      WHERE franchisor_users.user_id = auth.uid()
      AND franchisor_users.franchise_id = fdd_buyer_invitations.franchisor_id
    )
  );

CREATE POLICY "Service role has full access" ON fdd_buyer_invitations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FDD_CHUNKS POLICIES
-- =============================================
CREATE POLICY "Authenticated users can search chunks" ON fdd_chunks
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role has full access to fdd_chunks" ON fdd_chunks
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FDD_ENGAGEMENTS POLICIES
-- =============================================
CREATE POLICY "Service role full access" ON fdd_engagements
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can insert own engagements" ON fdd_engagements
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update own engagements" ON fdd_engagements
  FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Users can view own engagements" ON fdd_engagements
  FOR SELECT USING (auth.uid() = buyer_id);

-- =============================================
-- FDD_FRANCHISESCORE_CONSENTS POLICIES
-- =============================================
CREATE POLICY "Service role has full access" ON fdd_franchisescore_consents
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can insert own consents" ON fdd_franchisescore_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own consents" ON fdd_franchisescore_consents
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- FDD_ITEM_PAGE_MAPPINGS POLICIES
-- =============================================
CREATE POLICY "Authenticated users can view mappings" ON fdd_item_page_mappings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role has full access" ON fdd_item_page_mappings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FDD_QUESTION_ANSWERS POLICIES
-- =============================================
CREATE POLICY "Authenticated users can view answers" ON fdd_question_answers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role has full access" ON fdd_question_answers
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FDD_SEARCH_QUERIES POLICIES
-- =============================================
CREATE POLICY "Service role has full access" ON fdd_search_queries
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can insert own queries" ON fdd_search_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own queries" ON fdd_search_queries
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- FDDS POLICIES
-- =============================================
CREATE POLICY "Authenticated users can view FDDs" ON fdds
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Public can view published FDDs" ON fdds
  FOR SELECT USING (is_published = true);

CREATE POLICY "Service role has full access to fdds" ON fdds
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FRANCHISES POLICIES
-- =============================================
CREATE POLICY "Authenticated users can view franchises" ON franchises
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Franchisors can update their own franchises" ON franchises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM franchisor_users
      WHERE franchisor_users.user_id = auth.uid()
      AND franchisor_users.franchise_id = franchises.id
    )
  );

CREATE POLICY "Public can view active franchises" ON franchises
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role has full access to franchises" ON franchises
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FRANCHISOR_PROFILES POLICIES
-- =============================================
CREATE POLICY "Franchisors can update own profile" ON franchisor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Franchisors can view own profile" ON franchisor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access" ON franchisor_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- FRANCHISOR_USERS POLICIES
-- =============================================
CREATE POLICY "Franchisors can view own associations" ON franchisor_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access" ON franchisor_users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- LEAD_FDD_ACCESS POLICIES
-- =============================================
CREATE POLICY "Buyers can view their own FDD access" ON lead_fdd_access
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Franchisors can manage FDD access for their franchises" ON lead_fdd_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_users
      WHERE franchisor_users.user_id = auth.uid()
      AND franchisor_users.franchise_id = lead_fdd_access.franchisor_id
    )
  );

CREATE POLICY "Service role has full access" ON lead_fdd_access
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- LEAD_INVITATIONS POLICIES
-- =============================================
CREATE POLICY "Franchisors can create invitations" ON lead_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM franchisor_users
      WHERE franchisor_users.user_id = auth.uid()
      AND franchisor_users.franchise_id = lead_invitations.franchise_id
    )
  );

CREATE POLICY "Franchisors can view their invitations" ON lead_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM franchisor_users
      WHERE franchisor_users.user_id = auth.uid()
      AND franchisor_users.franchise_id = lead_invitations.franchise_id
    )
  );

CREATE POLICY "Service role has full access" ON lead_invitations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- LEADS POLICIES
-- =============================================
CREATE POLICY "Buyers can view own leads" ON leads
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Franchisors can manage leads for their franchises" ON leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_users
      WHERE franchisor_users.user_id = auth.uid()
      AND franchisor_users.franchise_id = leads.franchise_id
    )
  );

CREATE POLICY "Service role has full access to leads" ON leads
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- LENDER_PROFILES POLICIES
-- =============================================
CREATE POLICY "Lenders can update own profile" ON lender_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Lenders can view own profile" ON lender_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access" ON lender_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- =============================================
-- NOTES POLICIES
-- =============================================
CREATE POLICY "Users can delete own notes" ON notes
  FOR DELETE USING (
    lead_id IN (SELECT id FROM leads WHERE buyer_id = auth.uid())
  );

CREATE POLICY "Users can insert notes for own leads" ON notes
  FOR INSERT WITH CHECK (
    lead_id IN (SELECT id FROM leads WHERE buyer_id = auth.uid())
  );

CREATE POLICY "Users can update own notes" ON notes
  FOR UPDATE USING (
    lead_id IN (SELECT id FROM leads WHERE buyer_id = auth.uid())
  );

CREATE POLICY "Users can view own notes" ON notes
  FOR SELECT USING (
    lead_id IN (SELECT id FROM leads WHERE buyer_id = auth.uid())
  );

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================
CREATE POLICY "Service role has full access" ON notifications
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- USER_NOTES POLICIES
-- =============================================
CREATE POLICY "Users can delete own notes" ON user_notes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON user_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON user_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notes" ON user_notes
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- USERS POLICIES
-- =============================================
CREATE POLICY "Service role has full access to users" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
