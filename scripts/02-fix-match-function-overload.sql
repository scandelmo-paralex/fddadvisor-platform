-- Fix duplicate match_fdd_chunks function overload issue
-- This script drops all existing versions and creates a single canonical version

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS match_fdd_chunks(vector, float, integer, uuid);
DROP FUNCTION IF EXISTS match_fdd_chunks(vector, uuid, float, integer);

-- Create the canonical version with correct parameter order
CREATE OR REPLACE FUNCTION match_fdd_chunks(
  query_embedding VECTOR(768),
  fdd_id_filter UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  fdd_id UUID,
  content TEXT,
  page_number INT,
  chunk_index INT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fdd_chunks.id,
    fdd_chunks.fdd_id,
    fdd_chunks.content,
    fdd_chunks.page_number,
    fdd_chunks.chunk_index,
    1 - (fdd_chunks.embedding <=> query_embedding) AS similarity
  FROM fdd_chunks
  WHERE fdd_chunks.fdd_id = fdd_id_filter
    AND 1 - (fdd_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY fdd_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION match_fdd_chunks IS 'Semantic search function for FDD chunks using cosine similarity. Parameters: query_embedding (768-dim vector), fdd_id_filter (UUID), match_threshold (float, default 0.7), match_count (int, default 5)';
