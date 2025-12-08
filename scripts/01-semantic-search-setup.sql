-- =====================================================
-- Supabase Migration: Semantic Search for FDD Platform
-- STANDALONE VERSION - Creates fdds table if needed
-- =====================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- Table: fdds (Create if doesn't exist)
-- =====================================================
-- Main FDD table - create with basic structure if it doesn't exist

CREATE TABLE IF NOT EXISTS fdds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_name TEXT NOT NULL,
  pdf_url TEXT,
  pdf_path TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  chunks_processed BOOLEAN DEFAULT FALSE,
  chunk_count INTEGER DEFAULT 0,
  embeddings_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_fdds_franchise_name ON fdds(franchise_name);
CREATE INDEX IF NOT EXISTS idx_fdds_created_at ON fdds(created_at);

-- =====================================================
-- Table: fdd_chunks
-- =====================================================
-- Stores chunked text from FDDs with embeddings for semantic search

CREATE TABLE IF NOT EXISTS fdd_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fdd_id UUID NOT NULL REFERENCES fdds(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  item_number INTEGER CHECK (item_number BETWEEN 1 AND 23),
  page_number INTEGER NOT NULL,
  start_page INTEGER NOT NULL,
  end_page INTEGER NOT NULL,
  token_count INTEGER,
  embedding VECTOR(768), -- Google Gemini text-embedding-004 dimension
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fdd_chunks_fdd_id ON fdd_chunks(fdd_id);
CREATE INDEX IF NOT EXISTS idx_fdd_chunks_item_number ON fdd_chunks(item_number);
CREATE INDEX IF NOT EXISTS idx_fdd_chunks_page_number ON fdd_chunks(page_number);
CREATE INDEX IF NOT EXISTS idx_fdd_chunks_created_at ON fdd_chunks(created_at);

-- Vector similarity search index (IVFFlat)
CREATE INDEX IF NOT EXISTS idx_fdd_chunks_embedding ON fdd_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- =====================================================
-- Table: fdd_search_queries
-- =====================================================
-- Track user searches for analytics and improving results

CREATE TABLE IF NOT EXISTS fdd_search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  fdd_id UUID REFERENCES fdds(id) ON DELETE CASCADE,
  results_returned INTEGER,
  clicked_chunk_id UUID REFERENCES fdd_chunks(id) ON DELETE SET NULL,
  session_id TEXT,
  search_duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON fdd_search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_fdd_id ON fdd_search_queries(fdd_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_created_at ON fdd_search_queries(created_at);

-- =====================================================
-- Table: fdd_question_answers
-- =====================================================
-- Cache common questions for faster responses and better UX

CREATE TABLE IF NOT EXISTS fdd_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fdd_id UUID NOT NULL REFERENCES fdds(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  source_chunk_ids UUID[] DEFAULT '{}',
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  times_viewed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qa_fdd_id ON fdd_question_answers(fdd_id);
CREATE INDEX IF NOT EXISTS idx_qa_created_at ON fdd_question_answers(created_at);
CREATE INDEX IF NOT EXISTS idx_qa_question_text ON fdd_question_answers 
USING gin(to_tsvector('english', question_text));

-- =====================================================
-- Function: match_fdd_chunks
-- =====================================================
-- Performs vector similarity search across FDD chunks

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
    fdd_chunks.chunk_text,
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

-- =====================================================
-- Function: search_fdd_chunks_with_filters
-- =====================================================
-- Advanced search with item filtering

CREATE OR REPLACE FUNCTION search_fdd_chunks_with_filters(
  query_embedding VECTOR(768),
  fdd_id_filter UUID,
  item_numbers INT[] DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  chunk_text TEXT,
  item_number INT,
  page_number INT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fdd_chunks.id,
    fdd_chunks.chunk_text,
    fdd_chunks.item_number,
    fdd_chunks.page_number,
    1 - (fdd_chunks.embedding <=> query_embedding) AS similarity
  FROM fdd_chunks
  WHERE 
    fdd_chunks.fdd_id = fdd_id_filter
    AND fdd_chunks.embedding IS NOT NULL
    AND (item_numbers IS NULL OR fdd_chunks.item_number = ANY(item_numbers))
    AND 1 - (fdd_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY fdd_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- Trigger: Update chunk count on fdds table
-- =====================================================

CREATE OR REPLACE FUNCTION update_fdd_chunk_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE fdds 
    SET chunk_count = chunk_count + 1,
        chunks_processed = TRUE,
        embeddings_generated_at = NOW()
    WHERE id = NEW.fdd_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE fdds 
    SET chunk_count = GREATEST(chunk_count - 1, 0)
    WHERE id = OLD.fdd_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chunk_count ON fdd_chunks;
CREATE TRIGGER trigger_update_chunk_count
AFTER INSERT OR DELETE ON fdd_chunks
FOR EACH ROW
EXECUTE FUNCTION update_fdd_chunk_count();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE fdd_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdd_search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdd_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public FDD chunks are viewable by everyone" ON fdd_chunks;
DROP POLICY IF EXISTS "Service role can insert chunks" ON fdd_chunks;
DROP POLICY IF EXISTS "Users can view own search queries" ON fdd_search_queries;
DROP POLICY IF EXISTS "Users can insert own search queries" ON fdd_search_queries;
DROP POLICY IF EXISTS "Public Q&A are viewable by everyone" ON fdd_question_answers;
DROP POLICY IF EXISTS "Public FDDs are viewable by everyone" ON fdds;

-- Policy: Anyone can read public FDDs
CREATE POLICY "Public FDDs are viewable by everyone" 
ON fdds FOR SELECT 
USING (is_public = TRUE);

-- Policy: Anyone can read chunks from public FDDs
CREATE POLICY "Public FDD chunks are viewable by everyone" 
ON fdd_chunks FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM fdds 
    WHERE fdds.id = fdd_chunks.fdd_id 
    AND fdds.is_public = TRUE
  )
);

-- Policy: Only service role can insert chunks (backend only)
CREATE POLICY "Service role can insert chunks"
ON fdd_chunks FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy: Users can view their own search history
CREATE POLICY "Users can view own search queries"
ON fdd_search_queries FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own search queries
CREATE POLICY "Users can insert own search queries"
ON fdd_search_queries FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Anyone can read cached Q&A for public FDDs
CREATE POLICY "Public Q&A are viewable by everyone"
ON fdd_question_answers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM fdds 
    WHERE fdds.id = fdd_question_answers.fdd_id 
    AND fdds.is_public = TRUE
  )
);

-- =====================================================
-- Utility: Get embedding statistics
-- =====================================================

CREATE OR REPLACE VIEW fdd_embedding_stats AS
SELECT 
  f.id as fdd_id,
  f.franchise_name,
  f.chunk_count,
  f.chunks_processed,
  f.embeddings_generated_at,
  COUNT(c.id) as actual_chunk_count,
  AVG(c.token_count) as avg_chunk_tokens,
  MIN(c.token_count) as min_chunk_tokens,
  MAX(c.token_count) as max_chunk_tokens,
  COUNT(DISTINCT c.item_number) as items_covered
FROM fdds f
LEFT JOIN fdd_chunks c ON f.id = c.fdd_id
WHERE f.chunks_processed = TRUE
GROUP BY f.id, f.franchise_name, f.chunk_count, f.chunks_processed, f.embeddings_generated_at;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON TABLE fdd_chunks IS 'Stores text chunks from FDDs with vector embeddings for semantic search';
COMMENT ON TABLE fdd_search_queries IS 'Tracks user search queries for analytics and improvement';
COMMENT ON TABLE fdd_question_answers IS 'Caches common Q&A pairs for faster responses';
COMMENT ON FUNCTION match_fdd_chunks IS 'Performs vector similarity search across FDD chunks';
COMMENT ON COLUMN fdd_chunks.embedding IS 'Vector embedding (768 dimensions) from Google Gemini text-embedding-004';
COMMENT ON COLUMN fdd_chunks.chunk_index IS 'Sequential order of chunk in original document';

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✓ Semantic search migration completed successfully!';
  RAISE NOTICE 'Tables created:';
  RAISE NOTICE '  - fdds (main FDD table)';
  RAISE NOTICE '  - fdd_chunks (searchable text chunks)';
  RAISE NOTICE '  - fdd_search_queries (analytics)';
  RAISE NOTICE '  - fdd_question_answers (cached Q&A)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run the Python chunking pipeline on your FDD outputs';
  RAISE NOTICE '2. Test vector search with match_fdd_chunks() function';
  RAISE NOTICE '3. Build your RAG API endpoint';
  RAISE NOTICE '4. Create the semantic search UI';
END $$;
