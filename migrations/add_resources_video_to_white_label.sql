-- Migration: Add resources video fields to white_label_settings
-- Date: 2026-01-07
-- Description: Allows franchisors to customize the featured video in the Resources tab

-- Add new columns to white_label_settings table
ALTER TABLE white_label_settings 
ADD COLUMN IF NOT EXISTS resources_video_url TEXT,
ADD COLUMN IF NOT EXISTS resources_video_title TEXT,
ADD COLUMN IF NOT EXISTS resources_video_description TEXT;

-- Add comments for documentation
COMMENT ON COLUMN white_label_settings.resources_video_url IS 'YouTube URL for custom video in Resources tab (supports watch, embed, and youtu.be formats)';
COMMENT ON COLUMN white_label_settings.resources_video_title IS 'Custom title for the Resources tab video';
COMMENT ON COLUMN white_label_settings.resources_video_description IS 'Custom description text below the Resources tab video';
