# Bulk Processing Guide: 1500 FDDs

## Overview

Processing 1500 FDDs requires parallel processing, batch imports, and efficient database operations. This guide outlines the production-scale approach.

## Processing Strategy

### 1. Parallel Processing (Recommended)

**Current Script:** Processes 1 FDD at a time (~3-5 minutes each = 75-125 hours total)

**Optimized Approach:** Process 10-20 FDDs in parallel

\`\`\`python
# Update process-fdds-vertex-ai.py to use concurrent processing
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing

MAX_WORKERS = 10  # Process 10 FDDs simultaneously

def process_fdd_batch(fdd_files):
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(process_single_fdd, fdd): fdd for fdd in fdd_files}
        
        for future in as_completed(futures):
            fdd = futures[future]
            try:
                result = future.result()
                print(f"✓ Completed: {fdd}")
            except Exception as e:
                print(f"✗ Failed: {fdd} - {e}")
\`\`\`

**Time Savings:**
- 10 parallel workers: ~7.5-12.5 hours
- 20 parallel workers: ~3.75-6.25 hours

### 2. Batch Processing

Process FDDs in batches of 100 to manage memory and track progress:

\`\`\`python
BATCH_SIZE = 100

def process_in_batches(all_fdd_files):
    for i in range(0, len(all_fdd_files), BATCH_SIZE):
        batch = all_fdd_files[i:i+BATCH_SIZE]
        print(f"Processing batch {i//BATCH_SIZE + 1} ({len(batch)} FDDs)")
        
        process_fdd_batch(batch)
        
        # Save checkpoint after each batch
        save_checkpoint(i + len(batch))
\`\`\`

## Database Import Strategy

### Option 1: Batch SQL Inserts (Recommended for <500 franchises)

Generate SQL with multiple INSERT statements in a single transaction:

\`\`\`sql
BEGIN;

INSERT INTO franchises (id, name, industry, ...) VALUES
  ('uuid1', 'Franchise 1', 'Food', ...),
  ('uuid2', 'Franchise 2', 'Retail', ...),
  ...
  ('uuid100', 'Franchise 100', 'Service', ...);

COMMIT;
\`\`\`

**Pros:** Simple, works with Supabase SQL Editor
**Cons:** May hit size limits with 1500 franchises

### Option 2: PostgreSQL COPY Command (Recommended for 500+ franchises)

Most efficient for bulk imports:

\`\`\`bash
# Generate CSV file from JSON
python generate_csv_from_json.py all_franchises.json > franchises.csv

# Import via psql
psql $DATABASE_URL -c "\COPY franchises FROM 'franchises.csv' WITH (FORMAT csv, HEADER true)"
\`\`\`

**Pros:** Fastest import method, handles large datasets
**Cons:** Requires direct database access (not Supabase SQL Editor)

### Option 3: Supabase API Batch Insert (Recommended for production)

Use Supabase client library for programmatic batch inserts:

\`\`\`typescript
// scripts/bulk-import-to-supabase.ts
import { createClient } from '@supabase/supabase-js'
import franchisesData from './all_franchises.json'

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function batchInsert(franchises: any[], batchSize = 100) {
  for (let i = 0; i < franchises.length; i += batchSize) {
    const batch = franchises.slice(i, i + batchSize)
    
    const { error } = await supabase
      .from('franchises')
      .insert(batch)
    
    if (error) {
      console.error(`Batch ${i/batchSize + 1} failed:`, error)
    } else {
      console.log(`✓ Imported batch ${i/batchSize + 1} (${batch.length} franchises)`)
    }
    
    // Rate limiting: wait 1 second between batches
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

batchInsert(franchisesData)
\`\`\`

**Pros:** Programmatic, handles errors, respects rate limits
**Cons:** Requires Node.js script

## Cost Estimation

### Vertex AI (DeepSeek-R1) Costs

Assuming:
- Input: ~50,000 tokens per FDD (full FDD text)
- Output: ~5,000 tokens per FDD (detailed analysis)
- Cost: ~$0.50 per 1M tokens (DeepSeek-R1 pricing)

**Total Cost for 1500 FDDs:**
- Input: 1500 × 50,000 = 75M tokens = ~$37.50
- Output: 1500 × 5,000 = 7.5M tokens = ~$3.75
- **Total: ~$41.25**

### Database Storage

- Each franchise: ~50KB (with detailed JSONB data)
- 1500 franchises: ~75MB
- Supabase free tier: 500MB (sufficient)

## Recommended Workflow for 1500 FDDs

### Phase 1: Setup (1 hour)
1. Update `process-fdds-vertex-ai.py` with parallel processing
2. Organize 1500 FDD text files in a directory
3. Test with 10 FDDs to verify output quality

### Phase 2: Processing (4-8 hours)
1. Run parallel processing script with 10-20 workers
2. Monitor progress via checkpoint file
3. Handle any failures and retry

### Phase 3: Database Import (30 minutes)
1. Generate consolidated JSON output
2. Use Supabase API batch insert script
3. Import in batches of 100 franchises

### Phase 4: Verification (30 minutes)
1. Query database to verify count: `SELECT COUNT(*) FROM franchises`
2. Spot-check 10-20 franchises for data quality
3. Test app performance with 1500 franchises

## Performance Optimization

### App Performance with 1500 Franchises

**Discovery Page:**
- Current: Loads all franchises at once
- Optimized: Implement pagination (20-50 per page)
- Add search/filter to narrow results

**Database Queries:**
- Add indexes on frequently queried columns:
  \`\`\`sql
  CREATE INDEX idx_franchises_industry ON franchises(industry);
  CREATE INDEX idx_franchises_score ON franchises(franchise_score DESC);
  CREATE INDEX idx_franchises_name ON franchises(name);
  \`\`\`

**API Response:**
- Implement cursor-based pagination
- Cache frequently accessed data
- Use CDN for static assets

## Next Steps

Would you like me to:
1. **Update the Python script** with parallel processing?
2. **Create the Supabase batch import script**?
3. **Add pagination to the discovery page**?
4. **All of the above**?

Let me know and I'll implement the production-scale solution!
