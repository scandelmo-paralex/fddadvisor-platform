-- Create table for storing FDD Item page mappings
CREATE TABLE IF NOT EXISTS fdd_item_page_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_slug TEXT NOT NULL,
  item_number INTEGER NOT NULL CHECK (item_number >= 1 AND item_number <= 23),
  page_number INTEGER NOT NULL CHECK (page_number >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(franchise_slug, item_number)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_fdd_item_mappings_franchise 
ON fdd_item_page_mappings(franchise_slug);

-- Enable RLS
ALTER TABLE fdd_item_page_mappings ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage mappings
CREATE POLICY "Admins can manage item mappings"
ON fdd_item_page_mappings
FOR ALL
USING (true);

-- Insert the Blo Blow Dry Bar mappings
INSERT INTO fdd_item_page_mappings (franchise_slug, item_number, page_number) VALUES
('blo-blow-dry-bar', 1, 6),
('blo-blow-dry-bar', 2, 9),
('blo-blow-dry-bar', 3, 9),
('blo-blow-dry-bar', 4, 10),
('blo-blow-dry-bar', 5, 10),
('blo-blow-dry-bar', 6, 11),
('blo-blow-dry-bar', 7, 22),
('blo-blow-dry-bar', 8, 26),
('blo-blow-dry-bar', 9, 30),
('blo-blow-dry-bar', 10, 32),
('blo-blow-dry-bar', 11, 32),
('blo-blow-dry-bar', 12, 41),
('blo-blow-dry-bar', 13, 44),
('blo-blow-dry-bar', 14, 46),
('blo-blow-dry-bar', 15, 47),
('blo-blow-dry-bar', 16, 47),
('blo-blow-dry-bar', 17, 48),
('blo-blow-dry-bar', 18, 55),
('blo-blow-dry-bar', 19, 55),
('blo-blow-dry-bar', 20, 58),
('blo-blow-dry-bar', 21, 64),
('blo-blow-dry-bar', 22, 64),
('blo-blow-dry-bar', 23, 65)
ON CONFLICT (franchise_slug, item_number) 
DO UPDATE SET page_number = EXCLUDED.page_number, updated_at = NOW();
