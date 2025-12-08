-- ================================================
-- FDDHub Staging RLS Policies Migration (Fixed)
-- Only includes tables that exist in staging
-- Run in: FDDHub Staging SQL Editor
-- ================================================

-- ================================================
-- STEP 1: Helper Function
-- ================================================
CREATE OR REPLACE FUNCTION public.get_franchisor_accessible_buyer_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT l.buyer_id
  FROM leads l
  INNER JOIN franchisor_users fu ON fu.franchise_id = l.franchise_id
  WHERE fu.user_id = auth.uid()
    AND l.status IN ('qualified', 'contacted', 'converted')
$$;

-- ================================================
-- STEP 2: Enable RLS on all tables
-- ================================================
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
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ================================================
-- STEP 3: RLS Policies
-- ================================================

-- ========== USERS ==========
CREATE POLICY "Service role has full access to users" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ========== PROFILES ==========
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON profiles FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ========== BUYER_PROFILES ==========
CREATE POLICY "Admins can view all buyer profiles" ON buyer_profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Buyers can insert their own profile" ON buyer_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Buyers can update their own profile" ON buyer_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Buyers can view their own profile" ON buyer_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Franchisors can view profiles of their leads" ON buyer_profiles FOR SELECT USING (
  user_id IN (SELECT get_franchisor_accessible_buyer_ids())
);
CREATE POLICY "Service role full access" ON buyer_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== FRANCHISOR_PROFILES ==========
CREATE POLICY "Franchisors can insert their own profile" ON franchisor_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Franchisors can update their own profile" ON franchisor_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Franchisors can view their own profile" ON franchisor_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON franchisor_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== LENDER_PROFILES ==========
CREATE POLICY "Lenders can insert their own profile" ON lender_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Lenders can update their own profile" ON lender_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Lenders can view their own profile" ON lender_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON lender_profiles FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== FRANCHISOR_USERS ==========
CREATE POLICY "Franchisors can view their franchise associations" ON franchisor_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON franchisor_users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== FRANCHISES ==========
CREATE POLICY "Admins have full access to franchises" ON franchises FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Franchises are publicly readable" ON franchises FOR SELECT USING (true);
CREATE POLICY "Franchisors can update their own franchises" ON franchises FOR UPDATE USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE franchisor_users.franchise_id = franchises.id AND franchisor_users.user_id = auth.uid())
);
CREATE POLICY "Service role full access" ON franchises FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== FDDS ==========
CREATE POLICY "Admins have full access" ON fdds FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "FDDs are publicly readable" ON fdds FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON fdds FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== FDD_CHUNKS ==========
CREATE POLICY "Chunks are publicly readable" ON fdd_chunks FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON fdd_chunks FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== FDD_ITEM_PAGE_MAPPINGS ==========
CREATE POLICY "Item mappings are publicly readable" ON fdd_item_page_mappings FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON fdd_item_page_mappings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== FDD_QUESTION_ANSWERS ==========
CREATE POLICY "Question answers are publicly readable" ON fdd_question_answers FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON fdd_question_answers FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== FDD_SEARCH_QUERIES ==========
CREATE POLICY "Service role full access" ON fdd_search_queries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can insert search queries" ON fdd_search_queries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own search queries" ON fdd_search_queries FOR SELECT USING (auth.uid() = user_id);

-- ========== FDD_ENGAGEMENTS ==========
CREATE POLICY "Admins can view all engagements" ON fdd_engagements FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Franchisors can view engagements for their franchises" ON fdd_engagements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM franchisor_users fu
    JOIN fdds f ON f.franchise_id = fu.franchise_id
    WHERE fu.user_id = auth.uid() AND f.id = fdd_engagements.fdd_id
  )
);
CREATE POLICY "Service role full access" ON fdd_engagements FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can insert their own engagements" ON fdd_engagements FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own engagements" ON fdd_engagements FOR UPDATE USING (auth.uid()::text = buyer_id::text OR buyer_email = (SELECT email FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can view their own engagements" ON fdd_engagements FOR SELECT USING (auth.uid()::text = buyer_id::text OR buyer_email = (SELECT email FROM users WHERE id = auth.uid()));

-- ========== FDD_BUYER_CONSENTS ==========
CREATE POLICY "Buyers can insert their own consents" ON fdd_buyer_consents FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can view their own consents" ON fdd_buyer_consents FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Service role full access" ON fdd_buyer_consents FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== FDD_BUYER_INVITATIONS ==========
CREATE POLICY "Franchisors can manage invitations for their franchises" ON fdd_buyer_invitations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM franchisor_users fu
    JOIN fdds f ON f.franchise_id = fu.franchise_id
    WHERE fu.user_id = auth.uid() AND f.id = fdd_buyer_invitations.fdd_id
  )
);
CREATE POLICY "Service role full access" ON fdd_buyer_invitations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== FDD_FRANCHISESCORE_CONSENTS ==========
CREATE POLICY "Service role full access" ON fdd_franchisescore_consents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can insert their own consents" ON fdd_franchisescore_consents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own consents" ON fdd_franchisescore_consents FOR SELECT USING (auth.uid() = user_id);

-- ========== LEADS ==========
CREATE POLICY "Admins can view all leads" ON leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Buyers can view their own leads" ON leads FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Franchisors can view leads for their franchises" ON leads FOR SELECT USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE franchisor_users.franchise_id = leads.franchise_id AND franchisor_users.user_id = auth.uid())
);
CREATE POLICY "Service role full access" ON leads FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== LEAD_INVITATIONS ==========
CREATE POLICY "Franchisors can manage invitations for their franchises" ON lead_invitations FOR ALL USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE franchisor_users.franchise_id = lead_invitations.franchise_id AND franchisor_users.user_id = auth.uid())
);
CREATE POLICY "Service role full access" ON lead_invitations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== LEAD_FDD_ACCESS ==========
CREATE POLICY "Admins can view all access records" ON lead_fdd_access FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Buyers can view their own access records" ON lead_fdd_access FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Franchisors can view access for their franchises" ON lead_fdd_access FOR SELECT USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE franchisor_users.franchise_id = lead_fdd_access.franchise_id AND franchisor_users.user_id = auth.uid())
);
CREATE POLICY "Service role full access" ON lead_fdd_access FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== CLOSED_DEALS ==========
CREATE POLICY "Admins can view all closed deals" ON closed_deals FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Franchisors can view their closed deals" ON closed_deals FOR SELECT USING (
  EXISTS (SELECT 1 FROM franchisor_users WHERE franchisor_users.franchise_id = closed_deals.franchise_id AND franchisor_users.user_id = auth.uid())
);
CREATE POLICY "Service role full access" ON closed_deals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ========== SAVED_FRANCHISES ==========
CREATE POLICY "Service role full access" ON saved_franchises FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can delete their own saved franchises" ON saved_franchises FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved franchises" ON saved_franchises FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own saved franchises" ON saved_franchises FOR SELECT USING (auth.uid() = user_id);

-- ========== NOTIFICATIONS ==========
CREATE POLICY "Service role full access" ON notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- ========== ENGAGEMENT_EVENTS ==========
CREATE POLICY "Admins can view all events" ON engagement_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Service role full access" ON engagement_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can insert engagement events" ON engagement_events FOR INSERT WITH CHECK (true);

-- ================================================
-- Done! All RLS policies applied.
-- ================================================
