-- =====================================================
-- NOTIFICATIONS SYSTEM - Step 2: Functions
-- =====================================================
-- Version: 1.0
-- Date: January 13, 2026
-- Run AFTER Step 1 (tables) succeeds
-- =====================================================

-- Function to create a notification (called by API or triggers)
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
  -- Check user preferences
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

-- Verify functions created
SELECT 'Functions created successfully' as status;
