-- =====================================================
-- Fix match_fdd_chunks function - Use correct column names
-- =====================================================

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS match_fdd_chunks(vector, uuid, float, int);
DROP FUNCTION IF EXISTS match_fdd_chunks(vector, float, int, uuid);

-- Create the correct function with proper column names
CREATE OR REPLACE FUNCTION match_fdd_chunks(
  query_embedding VECTOR(768),
  fdd_id_filter UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  item_number INT,
  page_number INT,
  start_page INT,
  end_page INT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fdd_chunks.id,
    fdd_chunks.chunk_text,  -- Correct column name from schema
    fdd_chunks.item_number,
    fdd_chunks.page_number,
    fdd_chunks.start_page,
    fdd_chunks.end_page,
    fdd_chunks.metadata,
    1 - (fdd_chunks.embedding <=> query_embedding) AS similarity
  FROM fdd_chunks
  WHERE 
    fdd_chunks.fdd_id = fdd_id_filter
    AND fdd_chunks.embedding IS NOT NULL
    AND 1 - (fdd_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY fdd_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Verify the function was created
DO $$
BEGIN
  RAISE NOTICE '✓ match_fdd_chunks function recreated with correct column names';
  RAISE NOTICE 'Function signature: match_fdd_chunks(query_embedding, fdd_id_filter, match_threshold, match_count)';
END $$;
