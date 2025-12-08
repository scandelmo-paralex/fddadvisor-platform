-- Create the fdd_item_page_mappings table
CREATE TABLE IF NOT EXISTS public.fdd_item_page_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_slug TEXT NOT NULL,
  mapping_type TEXT NOT NULL CHECK (mapping_type IN ('item', 'exhibit', 'quick_link')),
  item_number INTEGER,
  page_number INTEGER NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fdd_item_mappings_franchise_slug 
  ON public.fdd_item_page_mappings(franchise_slug);

CREATE INDEX IF NOT EXISTS idx_fdd_item_mappings_type 
  ON public.fdd_item_page_mappings(mapping_type);

CREATE INDEX IF NOT EXISTS idx_fdd_item_mappings_franchise_type 
  ON public.fdd_item_page_mappings(franchise_slug, mapping_type);

-- Enable Row Level Security
ALTER TABLE public.fdd_item_page_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Allow public read access" 
  ON public.fdd_item_page_mappings 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert access" 
  ON public.fdd_item_page_mappings 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update access" 
  ON public.fdd_item_page_mappings 
  FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public delete access" 
  ON public.fdd_item_page_mappings 
  FOR DELETE 
  USING (true);

-- Add a comment
COMMENT ON TABLE public.fdd_item_page_mappings IS 'Stores page number mappings for FDD items, exhibits, and quick links';
