-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to update engagement qualification status
CREATE OR REPLACE FUNCTION update_engagement_qualification()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if lead meets engagement criteria:
  -- 1. Answered 3+ questions
  -- 2. Viewed Item 19
  -- 3. Spent 10+ minutes (600 seconds)
  
  UPDATE leads
  SET engagement_qualified = (
    NEW.answered_questions = TRUE AND
    NEW.viewed_item_19 = TRUE AND
    NEW.total_time_spent >= 600
  ),
  updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update engagement qualification
CREATE TRIGGER trigger_update_engagement_qualification
AFTER UPDATE OF answered_questions, viewed_item_19, total_time_spent ON leads
FOR EACH ROW
EXECUTE FUNCTION update_engagement_qualification();

-- Function to update verification qualification status
CREATE OR REPLACE FUNCTION update_verification_qualification()
RETURNS TRIGGER AS $$
BEGIN
  -- Update all leads for this buyer with verification status
  UPDATE leads
  SET verification_qualified = NEW.is_verified,
      updated_at = NOW()
  WHERE buyer_profile_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update verification qualification when buyer profile changes
CREATE TRIGGER trigger_update_verification_qualification
AFTER UPDATE OF fico_score, plaid_connected, background_check_completed ON buyer_profiles
FOR EACH ROW
EXECUTE FUNCTION update_verification_qualification();

-- Function to update lead status based on qualification
CREATE OR REPLACE FUNCTION update_lead_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update status based on qualification
  IF NEW.is_qualified = TRUE AND OLD.is_qualified = FALSE THEN
    NEW.status = 'qualified';
    NEW.qualified_at = NOW();
  ELSIF NEW.engagement_qualified = TRUE AND OLD.engagement_qualified = FALSE THEN
    NEW.status = 'engaged';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update lead status
CREATE TRIGGER trigger_update_lead_status
BEFORE UPDATE OF engagement_qualified, verification_qualified ON leads
FOR EACH ROW
EXECUTE FUNCTION update_lead_status();

-- Function to generate unique FDD link ID
CREATE OR REPLACE FUNCTION generate_fdd_link_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_franchisor_profiles_updated_at BEFORE UPDATE ON franchisor_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON buyer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lender_profiles_updated_at BEFORE UPDATE ON lender_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_franchises_updated_at BEFORE UPDATE ON franchises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pre_approval_requests_updated_at BEFORE UPDATE ON pre_approval_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_closed_deals_updated_at BEFORE UPDATE ON closed_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
