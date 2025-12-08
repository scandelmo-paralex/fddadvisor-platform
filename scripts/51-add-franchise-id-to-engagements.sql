-- Add franchise_id column to existing fdd_engagements table
-- This allows easier dashboard queries without joining through fdd_id

-- Step 1: Add the column (nullable initially)
ALTER TABLE public.fdd_engagements 
ADD COLUMN IF NOT EXISTS franchise_id uuid;

-- Step 2: Backfill franchise_id from existing fdd_id
-- Assuming fdds table has franchise_id column
UPDATE public.fdd_engagements fe
SET franchise_id = f.franchise_id
FROM public.fdds f
WHERE fe.fdd_id = f.id
AND fe.franchise_id IS NULL;

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_franchise_id 
ON public.fdd_engagements(franchise_id);

-- Step 4: Create composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_buyer_franchise 
ON public.fdd_engagements(buyer_id, franchise_id);
