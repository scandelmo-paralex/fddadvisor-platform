-- Add DocuSeal submission tracking to lead_fdd_access table
ALTER TABLE lead_fdd_access
ADD COLUMN IF NOT EXISTS docuseal_submission_id TEXT,
ADD COLUMN IF NOT EXISTS receipt_pdf_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_lead_fdd_access_docuseal 
ON lead_fdd_access(docuseal_submission_id);

-- Verify the new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lead_fdd_access' 
AND column_name IN ('docuseal_submission_id', 'receipt_pdf_url');
