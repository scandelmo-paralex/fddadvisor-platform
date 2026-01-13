-- =====================================================
-- NOTIFICATIONS CLEANUP - Run this FIRST
-- =====================================================
-- This removes any existing notification-related objects
-- that might be causing conflicts
-- =====================================================

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS trigger_notify_lead_signup ON lead_invitations;
DROP TRIGGER IF EXISTS trigger_notify_fdd_consent ON lead_fdd_access;
DROP TRIGGER IF EXISTS trigger_notify_receipt_signed ON lead_fdd_access;
DROP TRIGGER IF EXISTS trigger_notify_stage_change ON lead_invitations;

-- Drop functions
DROP FUNCTION IF EXISTS notify_on_lead_signup() CASCADE;
DROP FUNCTION IF EXISTS notify_on_fdd_consent() CASCADE;
DROP FUNCTION IF EXISTS notify_on_receipt_signed() CASCADE;
DROP FUNCTION IF EXISTS notify_on_stage_change() CASCADE;
DROP FUNCTION IF EXISTS create_notification(UUID, TEXT, TEXT, TEXT, JSONB, UUID) CASCADE;
DROP FUNCTION IF EXISTS create_notification() CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read(UUID) CASCADE;
DROP FUNCTION IF EXISTS mark_notification_read() CASCADE;
DROP FUNCTION IF EXISTS mark_all_notifications_read() CASCADE;
DROP FUNCTION IF EXISTS get_unread_notification_count() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_notifications(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_notifications() CASCADE;
DROP FUNCTION IF EXISTS create_default_notification_preferences() CASCADE;

-- Drop views
DROP VIEW IF EXISTS notifications_with_details CASCADE;

-- Drop tables (this will also drop their policies)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;

-- Verify cleanup
SELECT 'Cleanup complete - ready for fresh install' as status;
