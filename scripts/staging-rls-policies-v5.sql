-- =============================================
-- FDDHub Staging RLS Policies - Version 5
-- Corrected column names from schema documentation
-- =============================================

-- Enable RLS on all tables
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
ALTER TABLE pre_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_franchises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Helper function for franchisor buyer access
-- =============================================
CREATE OR REPLACE FUNCTION get_franchisor_accessible_buyer_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT l.buyer_id
  FROM leads l
  JOIN franchisor_users fu ON fu.franchise_id = l.franchise_id
  WHERE fu.user_id = auth.uid()
$$;

-- =============================================
-- buyer_profiles policies
-- Columns: id, user_id, first_name, last_name, email, phone, etc.
-- =============================================
CREATE POLICY "Users can view own buyer profile" ON buyer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own buyer profile" ON buyer_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own buyer profile" ON buyer_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Franchisors can view buyer profiles of their leads" ON buyer_profiles
  FOR SELECT USING (id IN (SELECT get_franchisor_accessible_buyer_ids()));

-- =============================================
-- closed_deals policies
-- Columns: id, lead_id, franchise_id, buyer_id, franchisor_id, deal_value, etc.
-- =============================================
CREATE POLICY "Franchisors can view own closed deals" ON closed_deals
  FOR SELECT USING (auth.uid() = franchisor_id);

CREATE POLICY "Franchisors can insert closed deals" ON closed_deals
  FOR INSERT WITH CHECK (auth.uid() = franchisor_id);

CREATE POLICY "Buyers can view own closed deals" ON closed_deals
  FOR SELECT USING (auth.uid() = buyer_id);

-- =============================================
-- engagement_events policies
-- Columns: id, lead_id, event_type, description, created_by, created_at
-- =============================================
CREATE POLICY "Users can view engagement events they created" ON engagement_events
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert engagement events" ON engagement_events
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- =============================================
-- fdd_buyer_consents policies
-- Columns: id, fdd_id, franchise_id, buyer_id, buyer_email, consent_given, etc.
-- =============================================
CREATE POLICY "Buyers can view own consents" ON fdd_buyer_consents
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can insert own consents" ON fdd_buyer_consents
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Franchisors can view consents for their franchises" ON fdd_buyer_consents
  FOR SELECT USING (
    franchise_id IN (
      SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- fdd_buyer_invitations policies
-- Columns: id, fdd_id, franchise_id, buyer_email, invited_by, invitation_token, etc.
-- =============================================
CREATE POLICY "Franchisors can view invitations they sent" ON fdd_buyer_invitations
  FOR SELECT USING (auth.uid() = invited_by);

CREATE POLICY "Franchisors can insert invitations" ON fdd_buyer_invitations
  FOR INSERT WITH CHECK (auth.uid() = invited_by);

CREATE POLICY "Franchisors can update invitations they sent" ON fdd_buyer_invitations
  FOR UPDATE USING (auth.uid() = invited_by);

CREATE POLICY "Buyers can view invitations sent to them" ON fdd_buyer_invitations
  FOR SELECT USING (auth.uid() = buyer_id);

-- =============================================
-- fdd_chunks policies
-- Columns: id, fdd_id, chunk_text, chunk_index, item_number, page_number, embedding, etc.
-- =============================================
CREATE POLICY "Anyone can view FDD chunks for public FDDs" ON fdd_chunks
  FOR SELECT USING (
    fdd_id IN (SELECT id FROM fdds WHERE is_public = true)
  );

CREATE POLICY "Buyers with access can view FDD chunks" ON fdd_chunks
  FOR SELECT USING (
    fdd_id IN (
      SELECT f.id FROM fdds f
      JOIN lead_fdd_access lfa ON lfa.franchise_id = f.franchise_id
      WHERE lfa.buyer_id = auth.uid()
    )
  );

-- =============================================
-- fdd_engagements policies
-- Columns: id, fdd_id, buyer_id, buyer_email, buyer_name, event_type, franchise_id, etc.
-- =============================================
CREATE POLICY "Buyers can view own engagements" ON fdd_engagements
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can insert own engagements" ON fdd_engagements
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own engagements" ON fdd_engagements
  FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Franchisors can view engagements for their franchises" ON fdd_engagements
  FOR SELECT USING (
    franchise_id IN (
      SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- fdd_franchisescore_consents policies
-- Columns: id, user_id, fdd_id, consented, consented_at, ip_address, user_agent, etc.
-- =============================================
CREATE POLICY "Users can view own franchisescore consents" ON fdd_franchisescore_consents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own franchisescore consents" ON fdd_franchisescore_consents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own franchisescore consents" ON fdd_franchisescore_consents
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- fdd_item_page_mappings policies
-- Columns: id, franchise_slug, mapping_type, item_number, label, page_number, etc.
-- =============================================
CREATE POLICY "Anyone can view item page mappings" ON fdd_item_page_mappings
  FOR SELECT USING (true);

-- =============================================
-- fdd_question_answers policies
-- Columns: id, fdd_id, question_text, answer_text, source_chunk_ids, etc.
-- =============================================
CREATE POLICY "Anyone can view question answers for public FDDs" ON fdd_question_answers
  FOR SELECT USING (
    fdd_id IN (SELECT id FROM fdds WHERE is_public = true)
  );

CREATE POLICY "Users can insert question answers" ON fdd_question_answers
  FOR INSERT WITH CHECK (true);

-- =============================================
-- fdd_search_queries policies
-- Columns: id, user_id, query_text, fdd_id, results_returned, etc.
-- =============================================
CREATE POLICY "Users can view own search queries" ON fdd_search_queries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert search queries" ON fdd_search_queries
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- =============================================
-- fdds policies
-- Columns: id, franchise_name, pdf_url, pdf_path, is_public, franchise_id, etc.
-- =============================================
CREATE POLICY "Anyone can view public FDDs" ON fdds
  FOR SELECT USING (is_public = true);

CREATE POLICY "Franchisors can view their FDDs" ON fdds
  FOR SELECT USING (
    franchise_id IN (
      SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Buyers with access can view FDDs" ON fdds
  FOR SELECT USING (
    franchise_id IN (
      SELECT franchise_id FROM lead_fdd_access WHERE buyer_id = auth.uid()
    )
  );

-- =============================================
-- franchises policies
-- Columns: id, name, slug, description, industry, franchisor_id, etc.
-- =============================================
CREATE POLICY "Anyone can view active franchises" ON franchises
  FOR SELECT USING (status = 'active');

CREATE POLICY "Franchisors can view own franchises" ON franchises
  FOR SELECT USING (
    id IN (
      SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisors can update own franchises" ON franchises
  FOR UPDATE USING (
    id IN (
      SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- franchisor_profiles policies
-- Columns: id, user_id, company_name, contact_name, email, phone, etc.
-- =============================================
CREATE POLICY "Users can view own franchisor profile" ON franchisor_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own franchisor profile" ON franchisor_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own franchisor profile" ON franchisor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- franchisor_users policies
-- Columns: id, user_id, franchise_id (NOT franchisor_id), role, created_at
-- =============================================
CREATE POLICY "Users can view own franchisor_users records" ON franchisor_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view franchisor_users for same franchise" ON franchisor_users
  FOR SELECT USING (
    franchise_id IN (
      SELECT franchise_id FROM franchisor_users WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- lead_fdd_access policies
-- Columns: id, buyer_id, franchise_id, franchisor_id, granted_via, etc.
-- =============================================
CREATE POLICY "Buyers can view own FDD access" ON lead_fdd_access
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can update own FDD access" ON lead_fdd_access
  FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Franchisors can view FDD access for their franchises" ON lead_fdd_access
  FOR SELECT USING (auth.uid() = franchisor_id);

CREATE POLICY "Franchisors can insert FDD access" ON lead_fdd_access
  FOR INSERT WITH CHECK (auth.uid() = franchisor_id);

CREATE POLICY "Franchisors can update FDD access for their franchises" ON lead_fdd_access
  FOR UPDATE USING (auth.uid() = franchisor_id);

-- =============================================
-- lead_invitations policies
-- Columns: id, franchisor_id, franchise_id, lead_email, lead_name, invitation_token, etc.
-- =============================================
CREATE POLICY "Franchisors can view own invitations" ON lead_invitations
  FOR SELECT USING (auth.uid() = franchisor_id);

CREATE POLICY "Franchisors can insert invitations" ON lead_invitations
  FOR INSERT WITH CHECK (auth.uid() = franchisor_id);

CREATE POLICY "Franchisors can update own invitations" ON lead_invitations
  FOR UPDATE USING (auth.uid() = franchisor_id);

CREATE POLICY "Anyone can view invitation by token" ON lead_invitations
  FOR SELECT USING (true);

-- =============================================
-- leads policies
-- Columns: id, franchisor_id, buyer_id, franchise_id, status, source, notes, etc.
-- =============================================
CREATE POLICY "Franchisors can view own leads" ON leads
  FOR SELECT USING (auth.uid() = franchisor_id);

CREATE POLICY "Franchisors can insert leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = franchisor_id);

CREATE POLICY "Franchisors can update own leads" ON leads
  FOR UPDATE USING (auth.uid() = franchisor_id);

CREATE POLICY "Buyers can view leads where they are the buyer" ON leads
  FOR SELECT USING (auth.uid() = buyer_id);

-- =============================================
-- lender_profiles policies
-- Columns: id, user_id, company_name, contact_name, email, phone, loan_types, etc.
-- =============================================
CREATE POLICY "Users can view own lender profile" ON lender_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lender profile" ON lender_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lender profile" ON lender_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view lender profiles" ON lender_profiles
  FOR SELECT USING (true);

-- =============================================
-- notifications policies
-- Columns: id, user_id, title, message, type, read, link, created_at
-- =============================================
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- =============================================
-- pre_approvals policies
-- Columns: id, buyer_id, lender_id, amount, status, expires_at, created_at
-- =============================================
CREATE POLICY "Buyers can view own pre-approvals" ON pre_approvals
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Lenders can view pre-approvals they issued" ON pre_approvals
  FOR SELECT USING (auth.uid() = lender_id);

CREATE POLICY "Lenders can insert pre-approvals" ON pre_approvals
  FOR INSERT WITH CHECK (auth.uid() = lender_id);

CREATE POLICY "Lenders can update pre-approvals they issued" ON pre_approvals
  FOR UPDATE USING (auth.uid() = lender_id);

-- =============================================
-- questions policies
-- Columns: id, lead_id, question_text, answer_text, asked_by, answered_by, etc.
-- =============================================
CREATE POLICY "Users can view questions they asked" ON questions
  FOR SELECT USING (auth.uid() = asked_by);

CREATE POLICY "Users can insert questions" ON questions
  FOR INSERT WITH CHECK (auth.uid() = asked_by);

CREATE POLICY "Users can view questions they answered" ON questions
  FOR SELECT USING (auth.uid() = answered_by);

CREATE POLICY "Users can update questions they answered" ON questions
  FOR UPDATE USING (auth.uid() = answered_by);

-- =============================================
-- saved_franchises policies
-- Columns: id, buyer_id, franchise_id, notes, created_at
-- =============================================
CREATE POLICY "Users can view own saved franchises" ON saved_franchises
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Users can insert own saved franchises" ON saved_franchises
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can delete own saved franchises" ON saved_franchises
  FOR DELETE USING (auth.uid() = buyer_id);

-- =============================================
-- user_notes policies
-- Columns: id, user_id, fdd_id, page_number, note_text, highlight_text, etc.
-- =============================================
CREATE POLICY "Users can view own notes" ON user_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON user_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON user_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON user_notes
  FOR DELETE USING (auth.uid() = user_id);
