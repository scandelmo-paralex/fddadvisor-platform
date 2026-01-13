-- =====================================================
-- NOTIFICATIONS SYSTEM - Phase 1A: Tables Only (v2)
-- =====================================================
-- Version: 1.1
-- Date: January 13, 2026
-- Run this FIRST - creates tables only, no functions
-- =====================================================

-- Drop existing objects if they exist (clean slate)
DROP VIEW IF EXISTS notifications_with_details CASCADE;
DROP FUNCTION IF EXISTS create_notification CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read CASCADE;
DROP FUNCTION IF EXISTS mark_all_notifications_read CASCADE;
DROP FUNCTION IF EXISTS get_unread_notification_count CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_notifications CASCADE;

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

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
CREATE POLICY "Service role can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own preferences" ON notification_preferences;
CREATE POLICY "Users can view own preferences" ON notification_preferences
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own preferences" ON notification_preferences;
CREATE POLICY "Users can update own preferences" ON notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own preferences" ON notification_preferences;
CREATE POLICY "Users can insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- VERIFY TABLES CREATED
-- =====================================================

SELECT 'notifications table created' as status, 
       (SELECT count(*) FROM information_schema.columns WHERE table_name = 'notifications') as column_count;

SELECT 'notification_preferences table created' as status,
       (SELECT count(*) FROM information_schema.columns WHERE table_name = 'notification_preferences') as column_count;
