-- Create fdd_engagements table for tracking public FDD viewing engagement
-- This is separate from engagement_events which is tied to leads

CREATE TABLE IF NOT EXISTS fdd_engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Optional: null for anonymous viewing
  franchise_id UUID NOT NULL, -- Reference to franchises table (not enforced to allow flexibility)
  franchise_slug TEXT NOT NULL, -- Slug for easy lookup
  
  -- Engagement metrics
  time_spent INTEGER DEFAULT 0, -- Total time spent in seconds
  questions_asked TEXT[] DEFAULT '{}', -- Array of questions asked
  sections_viewed TEXT[] DEFAULT '{}', -- Array of sections/items viewed (e.g., "Item 19", "Item 7")
  notes_created INTEGER DEFAULT 0, -- Count of notes created
  downloaded BOOLEAN DEFAULT FALSE, -- Whether PDF was downloaded
  downloaded_at TIMESTAMPTZ, -- When PDF was downloaded
  
  -- Milestones
  viewed_fdd BOOLEAN DEFAULT FALSE,
  asked_questions BOOLEAN DEFAULT FALSE,
  viewed_item19 BOOLEAN DEFAULT FALSE,
  viewed_item7 BOOLEAN DEFAULT FALSE,
  created_notes BOOLEAN DEFAULT FALSE,
  spent_significant_time BOOLEAN DEFAULT FALSE, -- 15+ minutes
  
  -- Metadata
  start_time TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT, -- For tracking anonymous sessions
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_user_id ON fdd_engagements(user_id);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_franchise_id ON fdd_engagements(franchise_id);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_franchise_slug ON fdd_engagements(franchise_slug);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_session_id ON fdd_engagements(session_id);
CREATE INDEX IF NOT EXISTS idx_fdd_engagements_last_activity ON fdd_engagements(last_activity DESC);

-- Enable Row Level Security
ALTER TABLE fdd_engagements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow users to read their own engagement data
CREATE POLICY "Users can view their own engagement"
  ON fdd_engagements FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own engagement data
CREATE POLICY "Users can insert their own engagement"
  ON fdd_engagements FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to update their own engagement data
CREATE POLICY "Users can update their own engagement"
  ON fdd_engagements FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow franchisors to view engagement for their franchises
-- (This will need to be expanded based on your franchisor access control)
CREATE POLICY "Franchisors can view engagement for their franchises"
  ON fdd_engagements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM franchisor_profiles fp
      WHERE fp.user_id = auth.uid()
      AND fp.franchise_id::text = fdd_engagements.franchise_id::text
    )
  );

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
