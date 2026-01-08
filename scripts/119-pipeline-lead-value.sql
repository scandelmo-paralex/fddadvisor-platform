-- Migration: Add pipeline_lead_value column to franchisor_profiles
-- This allows franchisors to configure their estimated value per lead in the pipeline

ALTER TABLE franchisor_profiles 
ADD COLUMN IF NOT EXISTS pipeline_lead_value INTEGER DEFAULT 50000;

-- Add comment for documentation
COMMENT ON COLUMN franchisor_profiles.pipeline_lead_value IS 'Estimated dollar value per lead for pipeline calculations. Default is $50,000.';
