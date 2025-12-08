-- Create the fdd_item_page_mappings table for storing manual page mappings
CREATE TABLE IF NOT EXISTS public.fdd_item_page_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_slug TEXT NOT NULL,
  item_number INTEGER,
  item_type TEXT CHECK (item_type IN ('item', 'exhibit', 'quick_link')),
  label TEXT NOT NULL,
  page_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fdd_item_page_mappings_franchise_slug 
ON public.fdd_item_page_mappings(franchise_slug);

-- Enable RLS
ALTER TABLE public.fdd_item_page_mappings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read mappings
CREATE POLICY "Allow authenticated users to read page mappings"
ON public.fdd_item_page_mappings
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert/update/delete mappings
CREATE POLICY "Allow authenticated users to manage page mappings"
ON public.fdd_item_page_mappings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
