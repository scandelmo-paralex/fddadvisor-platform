-- Create comprehensive table for storing FDD page mappings (Items, Exhibits, Quick Links)
CREATE TABLE IF NOT EXISTS fdd_item_page_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_slug TEXT NOT NULL,
  mapping_type TEXT NOT NULL CHECK (mapping_type IN ('item', 'exhibit', 'quick_link')),
  item_number INTEGER CHECK (item_number IS NULL OR (item_number >= 1 AND item_number <= 23)),
  label TEXT NOT NULL,
  page_number INTEGER NOT NULL CHECK (page_number >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unique constraint for items (by item_number)
  CONSTRAINT unique_item_mapping UNIQUE (franchise_slug, mapping_type, item_number),
  -- Unique constraint for exhibits and quick links (by label)
  CONSTRAINT unique_label_mapping UNIQUE (franchise_slug, mapping_type, label)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_fdd_mappings_franchise 
ON fdd_item_page_mappings(franchise_slug);

CREATE INDEX IF NOT EXISTS idx_fdd_mappings_type 
ON fdd_item_page_mappings(mapping_type);

-- Enable RLS
ALTER TABLE fdd_item_page_mappings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read mappings
CREATE POLICY "Authenticated users can read mappings"
ON fdd_item_page_mappings
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to manage mappings (for admin tool)
CREATE POLICY "Authenticated users can manage mappings"
ON fdd_item_page_mappings
FOR ALL
USING (auth.role() = 'authenticated');

-- Insert sample Blo Blow Dry Bar mappings (Items only as reference)
INSERT INTO fdd_item_page_mappings (franchise_slug, mapping_type, item_number, label, page_number) VALUES
('blo-blow-dry-bar', 'item', 1, 'Item 1: The Franchisor and Predecessors', 6),
('blo-blow-dry-bar', 'item', 2, 'Item 2: Business Experience', 9),
('blo-blow-dry-bar', 'item', 3, 'Item 3: Litigation', 9),
('blo-blow-dry-bar', 'item', 4, 'Item 4: Bankruptcy', 10),
('blo-blow-dry-bar', 'item', 5, 'Item 5: Initial Fees', 10),
('blo-blow-dry-bar', 'item', 6, 'Item 6: Other Fees', 11),
('blo-blow-dry-bar', 'item', 7, 'Item 7: Estimated Initial Investment', 22),
('blo-blow-dry-bar', 'item', 8, 'Item 8: Restrictions on Sources', 26),
('blo-blow-dry-bar', 'item', 9, 'Item 9: Franchisee Obligations', 30),
('blo-blow-dry-bar', 'item', 10, 'Item 10: Financing', 32),
('blo-blow-dry-bar', 'item', 11, 'Item 11: Franchisor Assistance', 32),
('blo-blow-dry-bar', 'item', 12, 'Item 12: Territory', 41),
('blo-blow-dry-bar', 'item', 13, 'Item 13: Trademarks', 44),
('blo-blow-dry-bar', 'item', 14, 'Item 14: Patents and Copyrights', 46),
('blo-blow-dry-bar', 'item', 15, 'Item 15: Obligation to Participate', 47),
('blo-blow-dry-bar', 'item', 16, 'Item 16: Restrictions on What May Be Sold', 47),
('blo-blow-dry-bar', 'item', 17, 'Item 17: Renewal, Termination, Transfer', 48),
('blo-blow-dry-bar', 'item', 18, 'Item 18: Public Figures', 55),
('blo-blow-dry-bar', 'item', 19, 'Item 19: Financial Performance', 55),
('blo-blow-dry-bar', 'item', 20, 'Item 20: Outlets and Franchisee Information', 58),
('blo-blow-dry-bar', 'item', 21, 'Item 21: Financial Statements', 64),
('blo-blow-dry-bar', 'item', 22, 'Item 22: Contracts', 64),
('blo-blow-dry-bar', 'item', 23, 'Item 23: Receipts', 65)
ON CONFLICT ON CONSTRAINT unique_item_mapping 
DO UPDATE SET 
  label = EXCLUDED.label,
  page_number = EXCLUDED.page_number, 
  updated_at = NOW();

-- Note: Exhibits and Quick Links should be added through the admin tool for each franchise
-- Example structure for reference:
-- ('drybar', 'exhibit', NULL, 'Franchise Agreement', 150),
-- ('drybar', 'exhibit', NULL, 'Financial Statements', 200),
-- ('drybar', 'quick_link', NULL, 'Cover', 1),
-- ('drybar', 'quick_link', NULL, 'Table of Contents', 3),
-- ('drybar', 'quick_link', NULL, 'Item 19', 55),
