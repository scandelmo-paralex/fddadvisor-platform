-- FDDHub Staging - RLS Policies Migration v4
-- Fixed: franchisor_users uses franchise_id, not franchisor_id

-- ============================================
-- 1. HELPER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.get_franchisor_accessible_buyer_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT bp.user_id
  FROM buyer_profiles bp
  JOIN fdd_engagements fe ON fe.buyer_id = bp.id
  JOIN fdds f ON f.id = fe.fdd_id
  JOIN franchisor_users fu ON fu.franchise_id = f.franchise_id
  WHERE fu.user_id = auth.uid()
$$;

-- ============================================
-- 2. ENABLE RLS ON ALL TABLES
-- ============================================
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

-- ============================================
-- 3. DROP EXISTING POLICIES (if any)
-- ============================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ============================================
-- 4. CREATE ALL POLICIES
-- ============================================

-- BUYER_PROFILES
CREATE POLICY "Buyers can update own profile" ON buyer_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Buyers can view own profile" ON buyer_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Franchisors can view engaged buyers" ON buyer_profiles FOR SELECT USING (user_id IN (SELECT get_franchisor_accessible_buyer_ids()));
CREATE POLICY "Users can insert own buyer profile" ON buyer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CLOSED_DEALS
CREATE POLICY "Franchisors can insert closed deals" ON closed_deals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = closed_deals.franchise_id)
);
CREATE POLICY "Franchisors can view own closed deals" ON closed_deals FOR SELECT USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = closed_deals.franchise_id)
);

-- ENGAGEMENT_EVENTS
CREATE POLICY "Users can insert own engagement events" ON engagement_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM leads WHERE id = engagement_events.lead_id AND (buyer_id = auth.uid() OR franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())))
);
CREATE POLICY "Users can view own engagement events" ON engagement_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM leads WHERE id = engagement_events.lead_id AND (buyer_id = auth.uid() OR franchisor_id IN (SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid())))
);

-- FDD_BUYER_CONSENTS
CREATE POLICY "Buyers can insert own consents" ON fdd_buyer_consents FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can view own consents" ON fdd_buyer_consents FOR SELECT USING (auth.uid() = buyer_id);

-- FDD_BUYER_INVITATIONS
CREATE POLICY "Buyers can view own invitations" ON fdd_buyer_invitations FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Franchisors can insert invitations" ON fdd_buyer_invitations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = fdd_buyer_invitations.franchisor_id)
);
CREATE POLICY "Franchisors can view own invitations" ON fdd_buyer_invitations FOR SELECT USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = fdd_buyer_invitations.franchisor_id)
);

-- FDD_CHUNKS
CREATE POLICY "Anyone can read chunks" ON fdd_chunks FOR SELECT USING (true);
CREATE POLICY "Service role can manage chunks" ON fdd_chunks FOR ALL USING (auth.role() = 'service_role');

-- FDD_ENGAGEMENTS
CREATE POLICY "Buyers can insert own engagements" ON fdd_engagements FOR INSERT WITH CHECK (auth.uid()::text = buyer_email OR auth.uid() = buyer_id);
CREATE POLICY "Buyers can update own engagements" ON fdd_engagements FOR UPDATE USING (auth.uid()::text = buyer_email OR auth.uid() = buyer_id);
CREATE POLICY "Buyers can view own engagements" ON fdd_engagements FOR SELECT USING (auth.uid()::text = buyer_email OR auth.uid() = buyer_id);
CREATE POLICY "Franchisors can view engagements for their FDDs" ON fdd_engagements FOR SELECT USING (
  EXISTS (SELECT 1 FROM fdds f JOIN franchisor_users fu ON fu.franchise_id = f.franchise_id WHERE f.id = fdd_engagements.fdd_id AND fu.user_id = auth.uid())
);

-- FDD_FRANCHISESCORE_CONSENTS
CREATE POLICY "Users can insert own franchisescore consents" ON fdd_franchisescore_consents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own franchisescore consents" ON fdd_franchisescore_consents FOR SELECT USING (auth.uid() = user_id);

-- FDD_ITEM_PAGE_MAPPINGS
CREATE POLICY "Anyone can view item mappings" ON fdd_item_page_mappings FOR SELECT USING (true);
CREATE POLICY "Service role can manage mappings" ON fdd_item_page_mappings FOR ALL USING (auth.role() = 'service_role');

-- FDD_QUESTION_ANSWERS
CREATE POLICY "Anyone can view answers" ON fdd_question_answers FOR SELECT USING (true);
CREATE POLICY "Service role can manage answers" ON fdd_question_answers FOR ALL USING (auth.role() = 'service_role');

-- FDD_SEARCH_QUERIES
CREATE POLICY "Users can insert own search queries" ON fdd_search_queries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own search queries" ON fdd_search_queries FOR SELECT USING (auth.uid() = user_id);

-- FDDS
CREATE POLICY "Authenticated users can view FDDs" ON fdds FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Franchisors can manage own FDDs" ON fdds FOR ALL USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = fdds.franchise_id)
);
CREATE POLICY "Service role can manage FDDs" ON fdds FOR ALL USING (auth.role() = 'service_role');

-- FRANCHISES
CREATE POLICY "Anyone can view franchises" ON franchises FOR SELECT USING (true);
CREATE POLICY "Franchisors can update own franchise" ON franchises FOR UPDATE USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = franchises.id)
);
CREATE POLICY "Service role can manage franchises" ON franchises FOR ALL USING (auth.role() = 'service_role');

-- FRANCHISOR_PROFILES
CREATE POLICY "Franchisors can update own profile" ON franchisor_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Franchisors can view own profile" ON franchisor_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own franchisor profile" ON franchisor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- FRANCHISOR_USERS
CREATE POLICY "Franchisors can view own associations" ON franchisor_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage franchisor_users" ON franchisor_users FOR ALL USING (auth.role() = 'service_role');

-- LEAD_FDD_ACCESS
CREATE POLICY "Buyers can view own FDD access" ON lead_fdd_access FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Franchisors can insert FDD access" ON lead_fdd_access FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = lead_fdd_access.franchisor_id)
);
CREATE POLICY "Franchisors can view own FDD access grants" ON lead_fdd_access FOR SELECT USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = lead_fdd_access.franchisor_id)
);

-- LEAD_INVITATIONS
CREATE POLICY "Franchisors can insert lead invitations" ON lead_invitations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = lead_invitations.franchisor_id)
);
CREATE POLICY "Franchisors can view own lead invitations" ON lead_invitations FOR SELECT USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = lead_invitations.franchisor_id)
);

-- LEADS
CREATE POLICY "Buyers can view own leads" ON leads FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Franchisors can insert leads" ON leads FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = leads.franchisor_id)
);
CREATE POLICY "Franchisors can update own leads" ON leads FOR UPDATE USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = leads.franchisor_id)
);
CREATE POLICY "Franchisors can view own leads" ON leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE user_id = auth.uid() AND franchise_id = leads.franchisor_id)
);

-- LENDER_PROFILES
CREATE POLICY "Lenders can update own profile" ON lender_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Lenders can view own profile" ON lender_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lender profile" ON lender_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- USER_NOTES
CREATE POLICY "Users can delete own notes" ON user_notes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON user_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON user_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notes" ON user_notes FOR SELECT USING (auth.uid() = user_id);

-- USERS
CREATE POLICY "Users can update own record" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own record" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Service role can manage users" ON users FOR ALL USING (auth.role() = 'service_role');
