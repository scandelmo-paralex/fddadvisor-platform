-- Create fdd_engagements table for tracking user engagement with FDDs
CREATE TABLE IF NOT EXISTS fdd_engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  franchise_id UUID REFERENCES franchises(id) ON DELETE CASCADE,
  franchise_slug TEXT NOT NULL,
  session_id TEXT,
  time_spent INTEGER DEFAULT 0,
  questions_asked INTEGER DEFAULT 0,
  sections_viewed TEXT[] DEFAULT '{}',
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_user_id ON fdd_engagements(user_id);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_franchise_id ON fdd_engagements(franchise_id);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_franchise_slug ON fdd_engagements(franchise_slug);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_session_id ON fdd_engagements(session_id);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_last_activity ON fdd_engagements(last_activity DESC);

-- Enable RLS
ALTER TABLE fdd_engagements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own engagements"
  ON fdd_engagements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own engagements"
  ON fdd_engagements FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own engagements"
  ON fdd_engagements FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fdd_engagements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_fdd_engagements_updated_at
  BEFORE UPDATE ON fdd_engagements
  FOR EACH ROW
  EXECUTE FUNCTION update_fdd_engagements_updated_at();
