-- Add user_notes table to staging (already exists in production)
-- Run this in FDDHub Staging SQL Editor

CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fdd_id UUID NOT NULL REFERENCES fdds(id) ON DELETE CASCADE,
  page_number INTEGER,
  note_text TEXT NOT NULL,
  highlight_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_fdd_id ON user_notes(fdd_id);

-- Enable RLS
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own notes
CREATE POLICY "Users can view own notes"
  ON user_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON user_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON user_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON user_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Grant service role full access for API operations
GRANT ALL ON user_notes TO service_role;
