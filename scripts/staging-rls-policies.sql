-- =============================================
-- RLS POLICIES MIGRATION FOR STAGING
-- Run this in FDDHub Staging SQL Editor
-- =============================================

-- First, create the helper function used by RLS policies
CREATE OR REPLACE FUNCTION get_franchisor_accessible_buyer_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT lfa.buyer_id
  FROM lead_fdd_access lfa
  JOIN franchisor_profiles fp ON fp.id = lfa.franchisor_id
  WHERE fp.user_id = auth.uid()
$$;

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
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =============================================
-- BUYER_PROFILES POLICIES
-- =============================================

CREATE POLICY "Buyers can insert own profile" ON buyer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Buyers can update own profile" ON buyer_profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Buyers can view own profile" ON buyer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Franchisors can view buyer profiles for their leads" ON buyer_profiles
  FOR SELECT USING (id IN (SELECT get_franchisor_accessible_buyer_ids()));

-- =============================================
-- FDD_BUYER_CONSENTS POLICIES
-- =============================================

CREATE POLICY "Buyers can give consent" ON fdd_buyer_consents
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Buyers read their consents" ON fdd_buyer_consents
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Franchisors read consent records for their FDDs" ON fdd_buyer_consents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM franchisor_users
      WHERE franchisor_users.user_id = auth.uid()
        AND franchisor_users.franchise_id = fdd_buyer_consents.franchise_id
    )
  );

-- =============================================
-- FDD_BUYER_INVITATIONS POLICIES
-- =============================================

CREATE POLICY "Buyers accept their invitations" ON fdd_buyer_invitations
  FOR UPDATE 
  USING (
    buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    AND buyer_id IS NULL
  )
  WITH CHECK (
    buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    AND buyer_id = auth.uid()
  );

CREATE POLICY "Buyers view their invitations" ON fdd_buyer_invitations
  FOR SELECT USING (
    buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    OR buyer_id = auth.uid()
  );

CREATE POLICY "Franchisors manage own invitations" ON fdd_buyer_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_users
      WHERE franchisor_users.user_id = auth.uid()
        AND franchisor_users.franchise_id = fdd_buyer_invitations.franchise_id
    )
  );

-- =============================================
-- FDD_CHUNKS POLICIES
-- =============================================

CREATE POLICY "Public FDD chunks are viewable by everyone" ON fdd_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fdds
      WHERE fdds.id = fdd_chunks.fdd_id AND fdds.is_public = true
    )
  );

CREATE POLICY "Service role can insert chunks" ON fdd_chunks
  FOR INSERT TO service_role WITH CHECK (true);

-- =============================================
-- FDD_ENGAGEMENTS POLICIES
-- =============================================

CREATE POLICY "Allow engagement tracking for authorized buyers" ON fdd_engagements
  FOR INSERT WITH CHECK (
    buyer_id IN (
      SELECT lead_fdd_access.buyer_id FROM lead_fdd_access
      WHERE lead_fdd_access.buyer_id = fdd_engagements.buyer_id
    )
  );

CREATE POLICY "Buyers can insert their own engagements" ON fdd_engagements
  FOR INSERT WITH CHECK (
    buyer_id = auth.uid() 
    AND consent_given = true 
    AND EXISTS (
      SELECT 1 FROM fdd_buyer_consents
      WHERE fdd_buyer_consents.buyer_id = auth.uid()
        AND fdd_buyer_consents.fdd_id = fdd_engagements.fdd_id
        AND fdd_buyer_consents.consent_given = true
    )
  );

CREATE POLICY "Buyers can read own engagements" ON fdd_engagements
  FOR SELECT USING (
    buyer_id IN (
      SELECT buyer_profiles.id FROM buyer_profiles
      WHERE buyer_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers can update own engagements" ON fdd_engagements
  FOR UPDATE USING (
    buyer_id IN (
      SELECT buyer_profiles.id FROM buyer_profiles
      WHERE buyer_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers read their own engagements" ON fdd_engagements
  FOR SELECT USING (buyer_id = auth.uid());

CREATE POLICY "Franchisors can view engagements for their leads" ON fdd_engagements
  FOR SELECT USING (
    buyer_id IN (
      SELECT lead_fdd_access.buyer_id FROM lead_fdd_access
      WHERE lead_fdd_access.franchisor_id IN (
        SELECT franchisor_profiles.id FROM franchisor_profiles
        WHERE franchisor_profiles.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Franchisors read own engagements" ON fdd_engagements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM franchisor_users fu
      JOIN fdd_buyer_consents fbc ON fu.franchise_id = fbc.franchise_id
      WHERE fu.user_id = auth.uid() AND fbc.fdd_id = fdd_engagements.fdd_id
    )
  );

-- =============================================
-- FDD_FRANCHISESCORE_CONSENTS POLICIES
-- =============================================

CREATE POLICY "Users can insert their own consents" ON fdd_franchisescore_consents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own consents" ON fdd_franchisescore_consents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own consents" ON fdd_franchisescore_consents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- FDD_ITEM_PAGE_MAPPINGS POLICIES
-- =============================================

CREATE POLICY "Allow public delete access" ON fdd_item_page_mappings
  FOR DELETE USING (true);

CREATE POLICY "Allow public insert access" ON fdd_item_page_mappings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access" ON fdd_item_page_mappings
  FOR SELECT USING (true);

CREATE POLICY "Allow public update access" ON fdd_item_page_mappings
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated users can manage mappings" ON fdd_item_page_mappings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read mappings" ON fdd_item_page_mappings
  FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- FDD_QUESTION_ANSWERS POLICIES
-- =============================================

CREATE POLICY "Public Q&A are viewable by everyone" ON fdd_question_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fdds
      WHERE fdds.id = fdd_question_answers.fdd_id AND fdds.is_public = true
    )
  );

-- =============================================
-- FDD_SEARCH_QUERIES POLICIES
-- =============================================

CREATE POLICY "Users can insert own search queries" ON fdd_search_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own search queries" ON fdd_search_queries
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- FDDS POLICIES
-- =============================================

CREATE POLICY "Public FDDs are viewable by everyone" ON fdds
  FOR SELECT USING (is_public = true);

-- =============================================
-- FRANCHISES POLICIES
-- =============================================

CREATE POLICY "Anyone can view franchises" ON franchises
  FOR SELECT USING (true);

-- =============================================
-- FRANCHISOR_PROFILES POLICIES
-- =============================================

CREATE POLICY "Anyone can view franchisor profiles" ON franchisor_profiles
  FOR SELECT USING (true);

CREATE POLICY "Franchisors can insert own profile" ON franchisor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Franchisors can update own profile" ON franchisor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Franchisors can view own profile" ON franchisor_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- FRANCHISOR_USERS POLICIES
-- =============================================

CREATE POLICY "Users can read their own franchise associations" ON franchisor_users
  FOR SELECT USING (user_id = auth.uid());

-- =============================================
-- LEAD_FDD_ACCESS POLICIES
-- =============================================

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

CREATE POLICY "Service role can manage FDD access" ON lead_fdd_access
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================
-- LEAD_INVITATIONS POLICIES
-- =============================================

CREATE POLICY "Anyone can view invitation by token" ON lead_invitations
  FOR SELECT USING (true);

CREATE POLICY "Franchisors can create invitations" ON lead_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_invitations.franchisor_id
        AND franchisor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can manage own invitations" ON lead_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_invitations.franchisor_id
        AND franchisor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can update their invitations" ON lead_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = lead_invitations.franchisor_id
        AND franchisor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access" ON lead_invitations
  FOR ALL USING (true);

CREATE POLICY "Users can accept their own invitations" ON lead_invitations
  FOR UPDATE 
  USING (
    lead_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    OR buyer_id = auth.uid()
  )
  WITH CHECK (buyer_id = auth.uid());

-- =============================================
-- LEADS POLICIES
-- =============================================

CREATE POLICY "Franchisors can manage own leads" ON leads
  FOR ALL USING (
    franchisor_id IN (
      SELECT franchisor_profiles.id FROM franchisor_profiles
      WHERE franchisor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can view own leads" ON leads
  FOR SELECT USING (
    franchisor_id IN (
      SELECT franchisor_profiles.id FROM franchisor_profiles
      WHERE franchisor_profiles.user_id = auth.uid()
    )
  );

-- =============================================
-- LENDER_PROFILES POLICIES
-- =============================================

CREATE POLICY "Lenders can insert own profile" ON lender_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- SHARED_ACCESS POLICIES
-- =============================================

CREATE POLICY "Franchisors can manage own shared access" ON shared_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = shared_access.franchisor_id
        AND franchisor_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can view own shared access" ON shared_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles
      WHERE franchisor_profiles.id = shared_access.franchisor_id
        AND franchisor_profiles.user_id = auth.uid()
    )
  );

-- =============================================
-- USERS POLICIES
-- =============================================

CREATE POLICY "Service role can insert users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can insert own record" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth.uid() = id);

-- =============================================
-- DONE
-- =============================================

SELECT 'RLS policies applied successfully!' as status;
