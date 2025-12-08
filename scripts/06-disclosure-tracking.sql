-- Add disclosure tracking fields to database

-- Add Item 23 receipt URL to franchisor_profiles
ALTER TABLE franchisor_profiles 
ADD COLUMN IF NOT EXISTS item_23_receipt_url TEXT;

-- Add disclosure tracking to leads table (if it exists)
-- If leads table doesn't exist yet, this will be part of the main schema
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
    ALTER TABLE leads 
    ADD COLUMN IF NOT EXISTS disclosure_status TEXT DEFAULT 'sent' CHECK (disclosure_status IN ('sent', 'received')),
    ADD COLUMN IF NOT EXISTS item_23_signed_at TIMESTAMP WITH TIME ZONE,
    -- Added separate URL fields for complete document, franchisor copy, and buyer copy
    ADD COLUMN IF NOT EXISTS item_23_complete_copy_url TEXT,
    ADD COLUMN IF NOT EXISTS item_23_franchisor_copy_url TEXT,
    ADD COLUMN IF NOT EXISTS item_23_buyer_copy_url TEXT,
    ADD COLUMN IF NOT EXISTS item_23_signature_id TEXT;
  END IF;
END $$;

-- Create fdd_disclosures table for tracking
CREATE TABLE IF NOT EXISTS fdd_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  franchise_id UUID NOT NULL,
  franchisor_id UUID NOT NULL,
  disclosure_status TEXT NOT NULL DEFAULT 'sent' CHECK (disclosure_status IN ('sent', 'received')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  item_23_signed_at TIMESTAMP WITH TIME ZONE,
  -- Added separate URL fields for complete document, franchisor copy, and buyer copy
  item_23_complete_copy_url TEXT,
  item_23_franchisor_copy_url TEXT,
  item_23_buyer_copy_url TEXT,
  item_23_signature_id TEXT,
  unique_link_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fdd_disclosures ENABLE ROW LEVEL SECURITY;

-- Franchisors can view their own disclosures
CREATE POLICY "Franchisors can view own disclosures"
ON fdd_disclosures FOR SELECT
USING (
  franchisor_id IN (SELECT id FROM franchisor_profiles WHERE user_id = auth.uid())
);

-- Buyers can view disclosures sent to them
CREATE POLICY "Buyers can view own disclosures"
ON fdd_disclosures FOR SELECT
USING (
  lead_id IN (SELECT id FROM buyer_profiles WHERE user_id = auth.uid())
);

-- Buyers can update their own disclosure status (when signing)
CREATE POLICY "Buyers can update own disclosure status"
ON fdd_disclosures FOR UPDATE
USING (
  lead_id IN (SELECT id FROM buyer_profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  lead_id IN (SELECT id FROM buyer_profiles WHERE user_id = auth.uid())
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_fdd_disclosures_lead_id ON fdd_disclosures(lead_id);
CREATE INDEX IF NOT EXISTS idx_fdd_disclosures_franchisor_id ON fdd_disclosures(franchisor_id);
CREATE INDEX IF NOT EXISTS idx_fdd_disclosures_token ON fdd_disclosures(unique_link_token);

-- Add trigger for updated_at
CREATE TRIGGER update_fdd_disclosures_updated_at 
BEFORE UPDATE ON fdd_disclosures 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
