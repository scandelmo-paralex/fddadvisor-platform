-- Create fdd_engagements table for tracking user engagement with FDDs
CREATE TABLE IF NOT EXISTS fdd_engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE, -- Added foreign key to buyer_profiles
  franchise_id UUID NOT NULL, -- No FK constraint since franchises table structure unclear
  franchise_slug TEXT NOT NULL,
  session_id TEXT,
  time_spent INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  sections_viewed TEXT[] DEFAULT '{}',
  items_viewed TEXT[] DEFAULT '{}',
  notes_created INTEGER DEFAULT 0,
  downloaded BOOLEAN DEFAULT FALSE,
  downloaded_at TIMESTAMPTZ,
  viewed_fdd BOOLEAN DEFAULT FALSE,
  asked_questions BOOLEAN DEFAULT FALSE,
  viewed_item19 BOOLEAN DEFAULT FALSE,
  viewed_item7 BOOLEAN DEFAULT FALSE,
  created_notes BOOLEAN DEFAULT FALSE,
  spent_significant_time BOOLEAN DEFAULT FALSE,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(buyer_id, franchise_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_buyer_id ON fdd_engagements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_franchise_id ON fdd_engagements(franchise_id);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_franchise_slug ON fdd_engagements(franchise_slug);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_session_id ON fdd_engagements(session_id);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_last_activity ON fdd_engagements(last_activity DESC);

-- Enable RLS
ALTER TABLE fdd_engagements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Buyers can view their own engagements"
  ON fdd_engagements FOR SELECT
  USING (buyer_id = (SELECT auth.uid())::uuid);

CREATE POLICY "Service role can manage engagements"
  ON fdd_engagements FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fdd_engagements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_fdd_engagements_updated_at ON fdd_engagements;
CREATE TRIGGER update_fdd_engagements_updated_at
  BEFORE UPDATE ON fdd_engagements
  FOR EACH ROW
  EXECUTE FUNCTION update_fdd_engagements_updated_at();
