-- =====================================================
-- NOTIFICATIONS SYSTEM - Phase 1A: Tables Only
-- =====================================================
-- Version: 1.0
-- Date: January 13, 2026
-- Description: Create notifications tables WITHOUT triggers
-- Run this first, then Phase 1B for triggers
-- =====================================================

-- =====================================================
-- TABLE 1: notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  franchisor_profile_id UUID REFERENCES franchisor_profiles(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, read, created_at DESC) 
  WHERE read = FALSE;

CREATE INDEX IF NOT EXISTS idx_notifications_user_recent 
  ON notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_franchisor 
  ON notifications(franchisor_profile_id, created_at DESC);

-- =====================================================
-- TABLE 2: notification_preferences
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- In-app toggles
  in_app_lead_signup BOOLEAN DEFAULT TRUE,
  in_app_fdd_viewed BOOLEAN DEFAULT TRUE,
  in_app_receipt_signed BOOLEAN DEFAULT TRUE,
  in_app_high_engagement BOOLEAN DEFAULT TRUE,
  in_app_ai_question BOOLEAN DEFAULT TRUE,
  in_app_stage_change BOOLEAN DEFAULT TRUE,
  in_app_team_change BOOLEAN DEFAULT TRUE,
  
  -- Email toggles (future)
  email_lead_signup BOOLEAN DEFAULT TRUE,
  email_fdd_viewed BOOLEAN DEFAULT FALSE,
  email_receipt_signed BOOLEAN DEFAULT TRUE,
  email_high_engagement BOOLEAN DEFAULT TRUE,
  email_ai_question BOOLEAN DEFAULT FALSE,
  email_stage_change BOOLEAN DEFAULT FALSE,
  email_team_change BOOLEAN DEFAULT TRUE,
  
  email_digest TEXT DEFAULT 'immediate' CHECK (email_digest IN ('immediate', 'daily', 'weekly', 'off')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- BASIC FUNCTIONS (no triggers yet)
-- =====================================================

-- Function to create a notification (called by API)
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_franchisor_profile_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_preferences notification_preferences%ROWTYPE;
  v_should_create BOOLEAN := TRUE;
BEGIN
  SELECT * INTO v_preferences 
  FROM notification_preferences 
  WHERE user_id = p_user_id;
  
  IF FOUND THEN
    CASE p_type
      WHEN 'lead_signup' THEN v_should_create := v_preferences.in_app_lead_signup;
      WHEN 'fdd_viewed' THEN v_should_create := v_preferences.in_app_fdd_viewed;
      WHEN 'receipt_signed' THEN v_should_create := v_preferences.in_app_receipt_signed;
      WHEN 'high_engagement' THEN v_should_create := v_preferences.in_app_high_engagement;
      WHEN 'ai_question' THEN v_should_create := v_preferences.in_app_ai_question;
      WHEN 'stage_change' THEN v_should_create := v_preferences.in_app_stage_change;
      WHEN 'team_change' THEN v_should_create := v_preferences.in_app_team_change;
      ELSE v_should_create := TRUE;
    END CASE;
  END IF;
  
  IF v_should_create THEN
    INSERT INTO notifications (user_id, type, title, message, data, franchisor_profile_id)
    VALUES (p_user_id, p_type, p_title, p_message, p_data, p_franchisor_profile_id)
    RETURNING id INTO v_notification_id;
    RETURN v_notification_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark single notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE notifications 
  SET read = TRUE, read_at = NOW()
  WHERE id = p_notification_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications 
  SET read = TRUE, read_at = NOW()
  WHERE user_id = auth.uid() AND read = FALSE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = auth.uid() AND read = FALSE;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL
    AND read = TRUE;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TEST: Insert a test notification for your user
-- =====================================================

-- Uncomment and run after creating tables:
/*
INSERT INTO notifications (user_id, type, title, message, data)
SELECT 
  user_id,
  'lead_signup',
  'Test: New Lead Signup',
  'This is a test notification to verify the system works.',
  '{"lead_name": "Test User", "franchise_name": "Drybar"}'::jsonb
FROM franchisor_profiles
WHERE company_name = 'Paralex Inc'
LIMIT 1;
*/
