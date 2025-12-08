-- =============================================
-- FDDHub Staging - RLS Policies (Fixed v3)
-- Only includes tables that exist in staging
-- =============================================

-- Create helper function first
CREATE OR REPLACE FUNCTION public.get_franchisor_accessible_buyer_ids(p_franchisor_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT l.buyer_id
  FROM leads l
  WHERE l.franchisor_id = p_franchisor_id
    AND l.status IN ('qualified', 'contacted', 'converted');
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
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- DROP EXISTING POLICIES (if any)
-- =============================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- =============================================
-- USERS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins can do everything" ON users FOR ALL TO authenticated USING ((role = 'admin'));
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING ((auth.uid() = id));
CREATE POLICY "Users can view own profile" ON users FOR SELECT TO authenticated USING ((auth.uid() = id));

-- =============================================
-- BUYER_PROFILES TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to buyer_profiles" ON buyer_profiles FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Buyers can update own profile" ON buyer_profiles FOR UPDATE TO authenticated 
  USING ((auth.uid() = user_id));
CREATE POLICY "Buyers can view own profile" ON buyer_profiles FOR SELECT TO authenticated 
  USING ((auth.uid() = user_id));
CREATE POLICY "Franchisors view qualified leads profiles" ON buyer_profiles FOR SELECT TO authenticated 
  USING ((user_id IN (SELECT get_franchisor_accessible_buyer_ids((SELECT franchisor_users.franchisor_id FROM franchisor_users WHERE (franchisor_users.user_id = auth.uid()))))));

-- =============================================
-- FRANCHISOR_PROFILES TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access" ON franchisor_profiles FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Franchisors can update own profile" ON franchisor_profiles FOR UPDATE TO authenticated 
  USING ((auth.uid() = user_id));
CREATE POLICY "Franchisors can view own profile" ON franchisor_profiles FOR SELECT TO authenticated 
  USING ((auth.uid() = user_id));

-- =============================================
-- FRANCHISOR_USERS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to franchisor_users" ON franchisor_users FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Franchisors can view own links" ON franchisor_users FOR SELECT TO authenticated 
  USING ((auth.uid() = user_id));

-- =============================================
-- LENDER_PROFILES TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to lender_profiles" ON lender_profiles FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Lenders can update own profile" ON lender_profiles FOR UPDATE TO authenticated 
  USING ((auth.uid() = user_id));
CREATE POLICY "Lenders can view own profile" ON lender_profiles FOR SELECT TO authenticated 
  USING ((auth.uid() = user_id));

-- =============================================
-- FRANCHISES TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to franchises" ON franchises FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Authenticated users can view franchises" ON franchises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public can view franchises" ON franchises FOR SELECT TO anon USING (true);

-- =============================================
-- FDDS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to fdds" ON fdds FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Authenticated users can view fdds" ON fdds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public can view fdds" ON fdds FOR SELECT TO anon USING (true);

-- =============================================
-- FDD_CHUNKS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to fdd_chunks" ON fdd_chunks FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Authenticated users can view fdd_chunks" ON fdd_chunks FOR SELECT TO authenticated USING (true);

-- =============================================
-- FDD_ITEM_PAGE_MAPPINGS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to fdd_item_page_mappings" ON fdd_item_page_mappings FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Authenticated users can view fdd_item_page_mappings" ON fdd_item_page_mappings FOR SELECT TO authenticated USING (true);

-- =============================================
-- FDD_QUESTION_ANSWERS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to fdd_question_answers" ON fdd_question_answers FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Authenticated users can view fdd_question_answers" ON fdd_question_answers FOR SELECT TO authenticated USING (true);

-- =============================================
-- FDD_SEARCH_QUERIES TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to fdd_search_queries" ON fdd_search_queries FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Users can insert own search queries" ON fdd_search_queries FOR INSERT TO authenticated 
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own search queries" ON fdd_search_queries FOR SELECT TO authenticated 
  USING ((auth.uid() = user_id));

-- =============================================
-- LEADS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to leads" ON leads FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Buyers can view own leads" ON leads FOR SELECT TO authenticated 
  USING ((auth.uid() = buyer_id));
CREATE POLICY "Franchisors can update own leads" ON leads FOR UPDATE TO authenticated 
  USING ((franchisor_id IN (SELECT franchisor_users.franchisor_id FROM franchisor_users WHERE (franchisor_users.user_id = auth.uid()))));
CREATE POLICY "Franchisors can view own leads" ON leads FOR SELECT TO authenticated 
  USING ((franchisor_id IN (SELECT franchisor_users.franchisor_id FROM franchisor_users WHERE (franchisor_users.user_id = auth.uid()))));

-- =============================================
-- LEAD_INVITATIONS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to lead_invitations" ON lead_invitations FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Franchisors can create invitations" ON lead_invitations FOR INSERT TO authenticated 
  WITH CHECK ((franchisor_id IN (SELECT franchisor_users.franchisor_id FROM franchisor_users WHERE (franchisor_users.user_id = auth.uid()))));
CREATE POLICY "Franchisors can view own invitations" ON lead_invitations FOR SELECT TO authenticated 
  USING ((franchisor_id IN (SELECT franchisor_users.franchisor_id FROM franchisor_users WHERE (franchisor_users.user_id = auth.uid()))));
CREATE POLICY "Public can view invitations by token" ON lead_invitations FOR SELECT TO anon USING (true);

-- =============================================
-- LEAD_FDD_ACCESS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to lead_fdd_access" ON lead_fdd_access FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Buyers can view own fdd access" ON lead_fdd_access FOR SELECT TO authenticated 
  USING ((auth.uid() = buyer_id));
CREATE POLICY "Franchisors can grant fdd access" ON lead_fdd_access FOR INSERT TO authenticated 
  WITH CHECK ((franchisor_id IN (SELECT franchisor_users.franchisor_id FROM franchisor_users WHERE (franchisor_users.user_id = auth.uid()))));
CREATE POLICY "Franchisors can view fdd access" ON lead_fdd_access FOR SELECT TO authenticated 
  USING ((franchisor_id IN (SELECT franchisor_users.franchisor_id FROM franchisor_users WHERE (franchisor_users.user_id = auth.uid()))));

-- =============================================
-- FDD_BUYER_CONSENTS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to fdd_buyer_consents" ON fdd_buyer_consents FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Buyers can insert own consents" ON fdd_buyer_consents FOR INSERT TO authenticated 
  WITH CHECK ((auth.uid() = buyer_id));
CREATE POLICY "Buyers can view own consents" ON fdd_buyer_consents FOR SELECT TO authenticated 
  USING ((auth.uid() = buyer_id));

-- =============================================
-- FDD_BUYER_INVITATIONS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to fdd_buyer_invitations" ON fdd_buyer_invitations FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Buyers can view own invitations" ON fdd_buyer_invitations FOR SELECT TO authenticated 
  USING ((auth.uid() = buyer_id));
CREATE POLICY "Franchisors can create buyer invitations" ON fdd_buyer_invitations FOR INSERT TO authenticated 
  WITH CHECK (true);
CREATE POLICY "Franchisors can view invitations they sent" ON fdd_buyer_invitations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public can view invitations by token" ON fdd_buyer_invitations FOR SELECT TO anon USING (true);

-- =============================================
-- FDD_ENGAGEMENTS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to fdd_engagements" ON fdd_engagements FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Buyers can insert own engagements" ON fdd_engagements FOR INSERT TO authenticated 
  WITH CHECK ((auth.uid() = buyer_id));
CREATE POLICY "Buyers can update own engagements" ON fdd_engagements FOR UPDATE TO authenticated 
  USING ((auth.uid() = buyer_id));
CREATE POLICY "Buyers can view own engagements" ON fdd_engagements FOR SELECT TO authenticated 
  USING ((auth.uid() = buyer_id));
CREATE POLICY "Franchisors can view engagements for their franchises" ON fdd_engagements FOR SELECT TO authenticated 
  USING ((franchise_id IN (SELECT franchises.id FROM franchises WHERE (franchises.franchisor_id IN (SELECT franchisor_users.franchisor_id FROM franchisor_users WHERE (franchisor_users.user_id = auth.uid()))))));

-- =============================================
-- FDD_FRANCHISESCORE_CONSENTS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to fdd_franchisescore_consents" ON fdd_franchisescore_consents FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Users can insert own consents" ON fdd_franchisescore_consents FOR INSERT TO authenticated 
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own consents" ON fdd_franchisescore_consents FOR SELECT TO authenticated 
  USING ((auth.uid() = user_id));

-- =============================================
-- ENGAGEMENT_EVENTS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to engagement_events" ON engagement_events FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Users can insert own events" ON engagement_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view own events" ON engagement_events FOR SELECT TO authenticated USING (true);

-- =============================================
-- SAVED_FRANCHISES TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to saved_franchises" ON saved_franchises FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Buyers can delete own saved franchises" ON saved_franchises FOR DELETE TO authenticated 
  USING ((auth.uid() = user_id));
CREATE POLICY "Buyers can insert own saved franchises" ON saved_franchises FOR INSERT TO authenticated 
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Buyers can view own saved franchises" ON saved_franchises FOR SELECT TO authenticated 
  USING ((auth.uid() = user_id));

-- =============================================
-- CLOSED_DEALS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to closed_deals" ON closed_deals FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Franchisors can view own deals" ON closed_deals FOR SELECT TO authenticated 
  USING ((franchisor_id IN (SELECT franchisor_users.franchisor_id FROM franchisor_users WHERE (franchisor_users.user_id = auth.uid()))));

-- =============================================
-- NOTIFICATIONS TABLE POLICIES
-- =============================================
CREATE POLICY "Admins full access to notifications" ON notifications FOR ALL TO authenticated 
  USING ((EXISTS (SELECT 1 FROM users WHERE ((users.id = auth.uid()) AND (users.role = 'admin')))));
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated 
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated 
  USING ((auth.uid() = user_id));

-- =============================================
-- USER_NOTES TABLE POLICIES
-- =============================================
CREATE POLICY "Users can insert own notes" ON user_notes FOR INSERT TO authenticated 
  WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view own notes" ON user_notes FOR SELECT TO authenticated 
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own notes" ON user_notes FOR UPDATE TO authenticated 
  USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete own notes" ON user_notes FOR DELETE TO authenticated 
  USING ((auth.uid() = user_id));
