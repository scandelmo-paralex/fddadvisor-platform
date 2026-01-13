-- =====================================================
-- NOTIFICATIONS SYSTEM - Phase 1B: Triggers
-- =====================================================
-- Version: 1.0
-- Date: January 13, 2026
-- Description: Automatic notification triggers
-- Run AFTER Phase 1A (tables) is successful
-- =====================================================

-- =====================================================
-- TRIGGER 1: Lead Signup
-- Fires when buyer_id is set on lead_invitations
-- =====================================================

CREATE OR REPLACE FUNCTION notify_on_lead_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_franchisor_user_id UUID;
  v_franchisor_profile_id UUID;
  v_franchise_name TEXT;
  v_lead_name TEXT;
BEGIN
  -- Only trigger when buyer_id changes from NULL to a value
  IF OLD.buyer_id IS NULL AND NEW.buyer_id IS NOT NULL THEN
    
    -- Get franchisor user_id and franchise name
    -- lead_invitations.franchisor_id -> franchisor_profiles.id
    -- lead_invitations.franchise_id -> franchises.id
    SELECT fp.user_id, NEW.franchisor_id, f.name 
    INTO v_franchisor_user_id, v_franchisor_profile_id, v_franchise_name
    FROM franchisor_profiles fp, franchises f
    WHERE fp.id = NEW.franchisor_id
      AND f.id = NEW.franchise_id;
    
    v_lead_name := COALESCE(NEW.lead_name, NEW.lead_email);
    
    -- Notify franchisor owner
    IF v_franchisor_user_id IS NOT NULL THEN
      PERFORM create_notification(
        v_franchisor_user_id,
        'lead_signup',
        'New Lead: ' || v_lead_name,
        v_lead_name || ' has signed up and can now view your ' || COALESCE(v_franchise_name, 'franchise') || ' FDD.',
        jsonb_build_object(
          'invitation_id', NEW.id,
          'lead_name', v_lead_name,
          'lead_email', NEW.lead_email,
          'franchise_id', NEW.franchise_id,
          'franchise_name', v_franchise_name
        ),
        v_franchisor_profile_id
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_lead_signup ON lead_invitations;
CREATE TRIGGER trigger_notify_lead_signup
  AFTER UPDATE ON lead_invitations
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_lead_signup();


-- =====================================================
-- TRIGGER 2: FDD Consent Given
-- Fires when consent_given_at is set on lead_fdd_access
-- =====================================================

CREATE OR REPLACE FUNCTION notify_on_fdd_consent()
RETURNS TRIGGER AS $$
DECLARE
  v_franchisor_user_id UUID;
  v_franchisor_profile_id UUID;
  v_franchise_name TEXT;
  v_lead_name TEXT;
  v_lead_email TEXT;
  v_franchise_id UUID;
BEGIN
  -- Only trigger when consent_given_at changes from NULL to a value
  IF OLD.consent_given_at IS NULL AND NEW.consent_given_at IS NOT NULL THEN
    
    -- Get details from lead_invitations
    SELECT 
      li.lead_name,
      li.lead_email,
      li.franchise_id,
      li.franchisor_id,
      f.name,
      fp.user_id
    INTO 
      v_lead_name,
      v_lead_email,
      v_franchise_id,
      v_franchisor_profile_id,
      v_franchise_name,
      v_franchisor_user_id
    FROM lead_invitations li
    JOIN franchises f ON f.id = li.franchise_id
    JOIN franchisor_profiles fp ON fp.id = li.franchisor_id
    WHERE li.id = NEW.invitation_id;
    
    v_lead_name := COALESCE(v_lead_name, v_lead_email);
    
    -- Notify franchisor
    IF v_franchisor_user_id IS NOT NULL THEN
      PERFORM create_notification(
        v_franchisor_user_id,
        'fdd_viewed',
        v_lead_name || ' is viewing your FDD',
        v_lead_name || ' gave consent and is now reviewing the ' || COALESCE(v_franchise_name, '') || ' FDD.',
        jsonb_build_object(
          'invitation_id', NEW.invitation_id,
          'lead_name', v_lead_name,
          'lead_email', v_lead_email,
          'franchise_id', v_franchise_id,
          'franchise_name', v_franchise_name
        ),
        v_franchisor_profile_id
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_fdd_consent ON lead_fdd_access;
CREATE TRIGGER trigger_notify_fdd_consent
  AFTER UPDATE ON lead_fdd_access
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_fdd_consent();


-- =====================================================
-- TRIGGER 3: Receipt Signed
-- Fires when receipt_signed_at is set on lead_fdd_access
-- =====================================================

CREATE OR REPLACE FUNCTION notify_on_receipt_signed()
RETURNS TRIGGER AS $$
DECLARE
  v_franchisor_user_id UUID;
  v_franchisor_profile_id UUID;
  v_franchise_name TEXT;
  v_lead_name TEXT;
  v_lead_email TEXT;
  v_franchise_id UUID;
BEGIN
  -- Only trigger when receipt_signed_at changes from NULL to a value
  IF OLD.receipt_signed_at IS NULL AND NEW.receipt_signed_at IS NOT NULL THEN
    
    -- Get details from lead_invitations
    SELECT 
      li.lead_name,
      li.lead_email,
      li.franchise_id,
      li.franchisor_id,
      f.name,
      fp.user_id
    INTO 
      v_lead_name,
      v_lead_email,
      v_franchise_id,
      v_franchisor_profile_id,
      v_franchise_name,
      v_franchisor_user_id
    FROM lead_invitations li
    JOIN franchises f ON f.id = li.franchise_id
    JOIN franchisor_profiles fp ON fp.id = li.franchisor_id
    WHERE li.id = NEW.invitation_id;
    
    v_lead_name := COALESCE(v_lead_name, v_lead_email);
    
    -- Notify franchisor
    IF v_franchisor_user_id IS NOT NULL THEN
      PERFORM create_notification(
        v_franchisor_user_id,
        'receipt_signed',
        v_lead_name || ' signed the FDD receipt',
        v_lead_name || ' has signed the Item 23 acknowledgment receipt for ' || COALESCE(v_franchise_name, '') || '. The 14-day disclosure period has begun.',
        jsonb_build_object(
          'invitation_id', NEW.invitation_id,
          'lead_name', v_lead_name,
          'lead_email', v_lead_email,
          'franchise_id', v_franchise_id,
          'franchise_name', v_franchise_name,
          'receipt_signed_at', NEW.receipt_signed_at,
          'disclosure_expires_at', NEW.receipt_signed_at + INTERVAL '14 days'
        ),
        v_franchisor_profile_id
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_receipt_signed ON lead_fdd_access;
CREATE TRIGGER trigger_notify_receipt_signed
  AFTER UPDATE ON lead_fdd_access
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_receipt_signed();


-- =====================================================
-- TRIGGER 4: Pipeline Stage Change
-- Fires when stage_id changes on lead_invitations
-- =====================================================

CREATE OR REPLACE FUNCTION notify_on_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  v_franchisor_user_id UUID;
  v_franchisor_profile_id UUID;
  v_franchise_name TEXT;
  v_lead_name TEXT;
  v_old_stage_name TEXT;
  v_new_stage_name TEXT;
BEGIN
  -- Only trigger when stage_id changes and new stage is not null
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id AND NEW.stage_id IS NOT NULL THEN
    
    -- Get franchisor details
    SELECT fp.user_id, NEW.franchisor_id, f.name 
    INTO v_franchisor_user_id, v_franchisor_profile_id, v_franchise_name
    FROM franchisor_profiles fp, franchises f
    WHERE fp.id = NEW.franchisor_id
      AND f.id = NEW.franchise_id;
    
    -- Get stage names
    SELECT name INTO v_old_stage_name FROM pipeline_stages WHERE id = OLD.stage_id;
    SELECT name INTO v_new_stage_name FROM pipeline_stages WHERE id = NEW.stage_id;
    
    v_lead_name := COALESCE(NEW.lead_name, NEW.lead_email);
    
    -- Notify franchisor
    IF v_franchisor_user_id IS NOT NULL THEN
      PERFORM create_notification(
        v_franchisor_user_id,
        'stage_change',
        v_lead_name || ' moved to ' || COALESCE(v_new_stage_name, 'new stage'),
        'Pipeline stage changed from "' || COALESCE(v_old_stage_name, 'None') || '" to "' || COALESCE(v_new_stage_name, 'Unknown') || '".',
        jsonb_build_object(
          'invitation_id', NEW.id,
          'lead_name', v_lead_name,
          'lead_email', NEW.lead_email,
          'franchise_id', NEW.franchise_id,
          'franchise_name', v_franchise_name,
          'old_stage_id', OLD.stage_id,
          'old_stage_name', v_old_stage_name,
          'new_stage_id', NEW.stage_id,
          'new_stage_name', v_new_stage_name
        ),
        v_franchisor_profile_id
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_stage_change ON lead_invitations;
CREATE TRIGGER trigger_notify_stage_change
  AFTER UPDATE ON lead_invitations
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_stage_change();


-- =====================================================
-- VERIFICATION QUERY
-- Run this to verify triggers were created
-- =====================================================

-- SELECT trigger_name, event_object_table, action_timing, event_manipulation
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- AND trigger_name LIKE 'trigger_notify%';
