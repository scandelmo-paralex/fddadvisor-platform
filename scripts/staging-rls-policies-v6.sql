-- FDDHub Staging RLS Policies v6
-- Drops existing policies before creating to avoid conflicts

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
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- =====================================================

-- user_notes policies (already created earlier)
DROP POLICY IF EXISTS "Users can view own notes" ON user_notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON user_notes;
DROP POLICY IF EXISTS "Users can update own notes" ON user_notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON user_notes;

-- Drop all other potential existing policies
DROP POLICY IF EXISTS "Buyers can view own profile" ON buyer_profiles;
DROP POLICY IF EXISTS "Buyers can update own profile" ON buyer_profiles;
DROP POLICY IF EXISTS "Buyers can insert own profile" ON buyer_profiles;
DROP POLICY IF EXISTS "Franchisors can view buyer profiles for their leads" ON buyer_profiles;
DROP POLICY IF EXISTS "Service role has full access to buyer_profiles" ON buyer_profiles;
DROP POLICY IF EXISTS "Franchisors can view their closed deals" ON closed_deals;
DROP POLICY IF EXISTS "Franchisors can insert closed deals" ON closed_deals;
DROP POLICY IF EXISTS "Franchisors can update their closed deals" ON closed_deals;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON engagement_events;
DROP POLICY IF EXISTS "Allow select for own events" ON engagement_events;
DROP POLICY IF EXISTS "Users can view own consents" ON fdd_buyer_consents;
DROP POLICY IF EXISTS "Users can insert own consents" ON fdd_buyer_consents;
DROP POLICY IF EXISTS "Franchisors can view consents for their FDDs" ON fdd_buyer_consents;
DROP POLICY IF EXISTS "Service role has full access" ON fdd_buyer_consents;
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON fdd_buyer_invitations;
DROP POLICY IF EXISTS "Franchisors can manage their invitations" ON fdd_buyer_invitations;
DROP POLICY IF EXISTS "Service role full access" ON fdd_buyer_invitations;
DROP POLICY IF EXISTS "Public read access to chunks" ON fdd_chunks;
DROP POLICY IF EXISTS "Service role full access to chunks" ON fdd_chunks;
DROP POLICY IF EXISTS "Users can view own engagements" ON fdd_engagements;
DROP POLICY IF EXISTS "Users can insert own engagements" ON fdd_engagements;
DROP POLICY IF EXISTS "Users can update own engagements" ON fdd_engagements;
DROP POLICY IF EXISTS "Franchisors can view engagements for their FDDs" ON fdd_engagements;
DROP POLICY IF EXISTS "Service role has full access" ON fdd_engagements;
DROP POLICY IF EXISTS "Users can view own FranchiseScore consents" ON fdd_franchisescore_consents;
DROP POLICY IF EXISTS "Users can insert own FranchiseScore consents" ON fdd_franchisescore_consents;
DROP POLICY IF EXISTS "Service role has full access to franchisescore_consents" ON fdd_franchisescore_consents;
DROP POLICY IF EXISTS "Public read access to mappings" ON fdd_item_page_mappings;
DROP POLICY IF EXISTS "Service role full access to mappings" ON fdd_item_page_mappings;
DROP POLICY IF EXISTS "Public read access to answers" ON fdd_question_answers;
DROP POLICY IF EXISTS "Service role full access to answers" ON fdd_question_answers;
DROP POLICY IF EXISTS "Users can view own searches" ON fdd_search_queries;
DROP POLICY IF EXISTS "Users can insert own searches" ON fdd_search_queries;
DROP POLICY IF EXISTS "Service role has full access to search_queries" ON fdd_search_queries;
DROP POLICY IF EXISTS "Public read access to FDDs" ON fdds;
DROP POLICY IF EXISTS "Franchisors can manage their FDDs" ON fdds;
DROP POLICY IF EXISTS "Service role full access to FDDs" ON fdds;
DROP POLICY IF EXISTS "Public read access to franchises" ON franchises;
DROP POLICY IF EXISTS "Franchisors can update own franchise" ON franchises;
DROP POLICY IF EXISTS "Service role full access to franchises" ON franchises;
DROP POLICY IF EXISTS "Users can view own franchisor profile" ON franchisor_profiles;
DROP POLICY IF EXISTS "Users can update own franchisor profile" ON franchisor_profiles;
DROP POLICY IF EXISTS "Users can insert own franchisor profile" ON franchisor_profiles;
DROP POLICY IF EXISTS "Service role has full access to franchisor_profiles" ON franchisor_profiles;
DROP POLICY IF EXISTS "Franchisor users can view own record" ON franchisor_users;
DROP POLICY IF EXISTS "Admins can manage franchisor users" ON franchisor_users;
DROP POLICY IF EXISTS "Service role has full access to franchisor_users" ON franchisor_users;
DROP POLICY IF EXISTS "Franchisors can view their lead access records" ON lead_fdd_access;
DROP POLICY IF EXISTS "Franchisors can insert lead access records" ON lead_fdd_access;
DROP POLICY IF EXISTS "Franchisors can update their lead access records" ON lead_fdd_access;
DROP POLICY IF EXISTS "Buyers can view their own access records" ON lead_fdd_access;
DROP POLICY IF EXISTS "Service role has full access to lead_fdd_access" ON lead_fdd_access;
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON lead_invitations;
DROP POLICY IF EXISTS "Franchisors can manage their lead invitations" ON lead_invitations;
DROP POLICY IF EXISTS "Service role full access to lead_invitations" ON lead_invitations;
DROP POLICY IF EXISTS "Franchisors can view their leads" ON leads;
DROP POLICY IF EXISTS "Franchisors can insert leads" ON leads;
DROP POLICY IF EXISTS "Franchisors can update their leads" ON leads;
DROP POLICY IF EXISTS "Buyers can view leads where they are the buyer" ON leads;
DROP POLICY IF EXISTS "Service role has full access to leads" ON leads;
DROP POLICY IF EXISTS "Users can view own lender profile" ON lender_profiles;
DROP POLICY IF EXISTS "Users can update own lender profile" ON lender_profiles;
DROP POLICY IF EXISTS "Users can insert own lender profile" ON lender_profiles;
DROP POLICY IF EXISTS "Service role has full access to lender_profiles" ON lender_profiles;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view own user record" ON users;
DROP POLICY IF EXISTS "Users can update own user record" ON users;
DROP POLICY IF EXISTS "Service role has full access to users" ON users;

-- =====================================================
-- HELPER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION get_franchisor_accessible_buyer_ids()
RETURNS SETOF uuid AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT l.buyer_id
  FROM leads l
  INNER JOIN franchisor_users fu ON fu.franchise_id = l.franchisor_id
  WHERE fu.user_id = auth.uid()
  AND l.buyer_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CREATE ALL POLICIES
-- =====================================================

-- buyer_profiles
CREATE POLICY "Buyers can view own profile" ON buyer_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Buyers can update own profile" ON buyer_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Buyers can insert own profile" ON buyer_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Franchisors can view buyer profiles for their leads" ON buyer_profiles FOR SELECT USING (id IN (SELECT get_franchisor_accessible_buyer_ids()));
CREATE POLICY "Service role has full access to buyer_profiles" ON buyer_profiles FOR ALL USING (auth.role() = 'service_role');

-- closed_deals
CREATE POLICY "Franchisors can view their closed deals" ON closed_deals FOR SELECT USING (
  franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);
CREATE POLICY "Franchisors can insert closed deals" ON closed_deals FOR INSERT WITH CHECK (
  franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);
CREATE POLICY "Franchisors can update their closed deals" ON closed_deals FOR UPDATE USING (
  franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);

-- engagement_events
CREATE POLICY "Allow insert for authenticated users" ON engagement_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow select for own events" ON engagement_events FOR SELECT USING (auth.uid() IS NOT NULL);

-- fdd_buyer_consents
CREATE POLICY "Users can view own consents" ON fdd_buyer_consents FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Users can insert own consents" ON fdd_buyer_consents FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Franchisors can view consents for their FDDs" ON fdd_buyer_consents FOR SELECT USING (
  fdd_id IN (SELECT id FROM fdds WHERE franchise_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid()))
);
CREATE POLICY "Service role has full access" ON fdd_buyer_consents FOR ALL USING (auth.role() = 'service_role');

-- fdd_buyer_invitations
CREATE POLICY "Anyone can view invitations by token" ON fdd_buyer_invitations FOR SELECT USING (true);
CREATE POLICY "Franchisors can manage their invitations" ON fdd_buyer_invitations FOR ALL USING (
  franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);
CREATE POLICY "Service role full access" ON fdd_buyer_invitations FOR ALL USING (auth.role() = 'service_role');

-- fdd_chunks
CREATE POLICY "Public read access to chunks" ON fdd_chunks FOR SELECT USING (true);
CREATE POLICY "Service role full access to chunks" ON fdd_chunks FOR ALL USING (auth.role() = 'service_role');

-- fdd_engagements
CREATE POLICY "Users can view own engagements" ON fdd_engagements FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Users can insert own engagements" ON fdd_engagements FOR INSERT WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Users can update own engagements" ON fdd_engagements FOR UPDATE USING (buyer_id = auth.uid());
CREATE POLICY "Franchisors can view engagements for their FDDs" ON fdd_engagements FOR SELECT USING (
  fdd_id IN (SELECT id FROM fdds WHERE franchise_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid()))
);
CREATE POLICY "Service role has full access" ON fdd_engagements FOR ALL USING (auth.role() = 'service_role');

-- fdd_franchisescore_consents
CREATE POLICY "Users can view own FranchiseScore consents" ON fdd_franchisescore_consents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own FranchiseScore consents" ON fdd_franchisescore_consents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role has full access to franchisescore_consents" ON fdd_franchisescore_consents FOR ALL USING (auth.role() = 'service_role');

-- fdd_item_page_mappings
CREATE POLICY "Public read access to mappings" ON fdd_item_page_mappings FOR SELECT USING (true);
CREATE POLICY "Service role full access to mappings" ON fdd_item_page_mappings FOR ALL USING (auth.role() = 'service_role');

-- fdd_question_answers
CREATE POLICY "Public read access to answers" ON fdd_question_answers FOR SELECT USING (true);
CREATE POLICY "Service role full access to answers" ON fdd_question_answers FOR ALL USING (auth.role() = 'service_role');

-- fdd_search_queries
CREATE POLICY "Users can view own searches" ON fdd_search_queries FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own searches" ON fdd_search_queries FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role has full access to search_queries" ON fdd_search_queries FOR ALL USING (auth.role() = 'service_role');

-- fdds
CREATE POLICY "Public read access to FDDs" ON fdds FOR SELECT USING (true);
CREATE POLICY "Franchisors can manage their FDDs" ON fdds FOR ALL USING (
  franchise_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);
CREATE POLICY "Service role full access to FDDs" ON fdds FOR ALL USING (auth.role() = 'service_role');

-- franchises
CREATE POLICY "Public read access to franchises" ON franchises FOR SELECT USING (true);
CREATE POLICY "Franchisors can update own franchise" ON franchises FOR UPDATE USING (
  id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);
CREATE POLICY "Service role full access to franchises" ON franchises FOR ALL USING (auth.role() = 'service_role');

-- franchisor_profiles
CREATE POLICY "Users can view own franchisor profile" ON franchisor_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own franchisor profile" ON franchisor_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own franchisor profile" ON franchisor_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role has full access to franchisor_profiles" ON franchisor_profiles FOR ALL USING (auth.role() = 'service_role');

-- franchisor_users
CREATE POLICY "Franchisor users can view own record" ON franchisor_users FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can manage franchisor users" ON franchisor_users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Service role has full access to franchisor_users" ON franchisor_users FOR ALL USING (auth.role() = 'service_role');

-- lead_fdd_access
CREATE POLICY "Franchisors can view their lead access records" ON lead_fdd_access FOR SELECT USING (
  franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);
CREATE POLICY "Franchisors can insert lead access records" ON lead_fdd_access FOR INSERT WITH CHECK (
  franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);
CREATE POLICY "Franchisors can update their lead access records" ON lead_fdd_access FOR UPDATE USING (
  franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);
CREATE POLICY "Buyers can view their own access records" ON lead_fdd_access FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Service role has full access to lead_fdd_access" ON lead_fdd_access FOR ALL USING (auth.role() = 'service_role');

-- lead_invitations
CREATE POLICY "Anyone can view invitations by token" ON lead_invitations FOR SELECT USING (true);
CREATE POLICY "Franchisors can manage their lead invitations" ON lead_invitations FOR ALL USING (
  franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);
CREATE POLICY "Service role full access to lead_invitations" ON lead_invitations FOR ALL USING (auth.role() = 'service_role');

-- leads
CREATE POLICY "Franchisors can view their leads" ON leads FOR SELECT USING (
  franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);
CREATE POLICY "Franchisors can insert leads" ON leads FOR INSERT WITH CHECK (
  franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);
CREATE POLICY "Franchisors can update their leads" ON leads FOR UPDATE USING (
  franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())
);
CREATE POLICY "Buyers can view leads where they are the buyer" ON leads FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Service role has full access to leads" ON leads FOR ALL USING (auth.role() = 'service_role');

-- lender_profiles
CREATE POLICY "Users can view own lender profile" ON lender_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own lender profile" ON lender_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can insert own lender profile" ON lender_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role has full access to lender_profiles" ON lender_profiles FOR ALL USING (auth.role() = 'service_role');

-- notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- user_notes
CREATE POLICY "Users can view own notes" ON user_notes FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own notes" ON user_notes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own notes" ON user_notes FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notes" ON user_notes FOR DELETE USING (user_id = auth.uid());

-- users
CREATE POLICY "Users can view own user record" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own user record" ON users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Service role has full access to users" ON users FOR ALL USING (auth.role() = 'service_role');
