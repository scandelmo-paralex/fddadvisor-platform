# Complete FDD Processing Guide
**FDDAdvisor & FDDHub Production Workflow**

Version: 2.0  
Last Updated: December 1, 2025  
Status: Production

---

## Overview

This guide covers the complete end-to-end process for adding a new franchise to FDDAdvisor/FDDHub, from raw PDF to fully functional AI-powered viewer.

**Total Time:** ~15-20 minutes per franchise  
**Prerequisites:** FDD PDF file, franchise logo image

---

## Phase 1: FDD Analysis Pipeline

### Step 1.1: Run Item-by-Item Analysis

**Location:** `~/Downloads/fdd-advisor/scripts/`

\`\`\`bash
cd ~/Downloads/fdd-advisor/scripts

python3 vertex_item_by_item_pipeline.py \
  --pdf "path/to/Franchise_Name_FDD_2025.pdf" \
  --output "../pipeline_output/Franchise Name FDD (2025)/"
\`\`\`

> **IMPORTANT:** For full AI Chat coverage (including Exhibits), run the pipeline on the **ENTIRE PDF**, not just the Items pages. If you only process Items 1-23, the AI Chat will not be able to answer questions about Exhibits, Financial Statements, or Franchisee Lists.

**What This Does:**
- Extracts text from PDF using PDFPlumber
- Identifies and separates Items 1-23
- Analyzes each Item using Gemini 2.5 Flash
- Generates FranchiseScore™ with validation
- Creates full_text.txt, items folder, and analysis.json

**Expected Output Files:**
\`\`\`
pipeline_output/Franchise Name FDD (2025)/
├── items/
│   ├── item_01.txt
│   ├── item_02.txt
│   └── ... (through item_23.txt)
├── analysis.json
├── full_text.txt
└── synthesis_debug.txt
\`\`\`

**Time:** 8-12 minutes

---

### Step 1.2: Quality Control - FranchiseScore Review

**Open:** `pipeline_output/Franchise Name FDD (2025)/analysis.json`

#### Check 1: Overall Score Reasonability

\`\`\`bash
# Quick score check
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep '"franchise_score"'
\`\`\`

**Score Ranges:**
- 500-600: Excellent franchise (rare)
- 450-499: Good franchise
- 400-449: Fair franchise
- 350-399: Concerning franchise
- <350: High-risk franchise

**Red Flags:**
- Score >550 (too good to be true - check for validation errors)
- Score <300 (system crisis - verify data extraction worked)

---

#### Check 2: Dimension Breakdown

\`\`\`bash
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep -A 2 '"total_score"' | head -10
\`\`\`

**Expected Ranges:**
- Financial Transparency: 90-150 (most score 120-140)
- System Strength: 60-150 (check for declining systems)
- Franchisee Support: 90-150 (most score 100-120)
- Business Foundation: 80-150 (varies widely)

**Red Flags:**
- System Strength <80 (system contraction)
- Any dimension <50 (validation failure or data extraction issue)

---

#### Check 3: System Growth Pattern (Critical!)

\`\`\`bash
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep -A 8 '"System Growth Pattern"'
\`\`\`

**Key Metrics to Verify:**
- Total units count makes sense
- Openings vs closures ratio
- Closure rate calculation is correct
- Score matches the data (12 points = declining, 60 points = healthy)

**Red Flags:**
- Closure rate >20% (crisis level - like Amazing Lash at 34.8%)
- Score of 60 but explanation mentions closures (validation missed it)
- Negative unit growth but high score (validation error)

---

#### Check 4: Clean Record Scoring

\`\`\`bash
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep -A 8 '"Clean Record"'
\`\`\`

**Validation Check:**
- 0 cases = 42 points
- 1-2 cases = 35-40 points
- 3-5 cases = 25-30 points
- 6+ cases = 0-20 points

**With 3-Year Recency Filter:**
- Only counts cases filed 2022-2025
- OR older cases still ongoing/pending
- Pre-2022 resolved cases are disclosed but not scored

**Red Flags:**
- 0 litigation but score <42 (validation error)
- 10+ cases but score >20 (validation missed high count)
- Score is negative (impossible - validation failed)

---

#### Check 5: Territory Protection

\`\`\`bash
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep -A 8 '"Territory Protection"'
\`\`\`

**Common Scores:**
- 42 points: Full exclusive territory (rare)
- 36 points: Protected territory with minor exceptions
- 24 points: Limited protection (e-commerce exceptions) - **most common**
- 6 points: No protection

**Red Flags:**
- Score 42 but explanation mentions "exceptions" (validation bug)
- Formula says "24 points" but score is 42 (mismatch)

---

#### Check 6: Opportunities & Concerns

**Must have exactly:**
- 3 Opportunities
- 3 Concerns

**Quality Check:**
- Each has specific Item citations
- Uses neutral, factual language
- No forbidden words (impressive, robust, strong, etc.)
- Concerns exist even for high-scoring franchises

**Example Good Opportunity:**
\`\`\`json
{
  "title": "Detailed Item 19 Financial Performance Data",
  "description": "Item 19 provides financial performance data for 87 outlets...",
  "citation": "Item 19",
  "impact": "High"
}
\`\`\`

**Example Bad Opportunity (fix needed):**
\`\`\`json
{
  "title": "Impressive Financial Transparency",
  "description": "The franchisor demonstrates exceptional commitment...",
  "citation": "Item 19",
  "impact": "High"
}
\`\`\`

---

#### Check 7: Analytical Summary

**Requirements:**
- 4-5 sentences
- Opens with total score
- Cites specific Items
- No subjective language
- Balanced (mentions both strengths and concerns)

**Forbidden Words to Search For:**
\`\`\`bash
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep -i "impressive\|robust\|strong\|excellent\|comprehensive\|extensive"
\`\`\`

If found, validation needs improvement.

---

### Step 1.3: Fix Any Validation Issues

If validation errors found, rerun with fixes:

\`\`\`bash
# Backup current output
cp "pipeline_output/Franchise Name FDD (2025)/analysis.json" \
   "pipeline_output/Franchise Name FDD (2025)/analysis_backup.json"

# Rerun pipeline (validation fixes already applied)
python3 vertex_item_by_item_pipeline.py \
  --pdf "path/to/Franchise_Name_FDD_2025.pdf" \
  --output "../pipeline_output/Franchise Name FDD (2025)/"
\`\`\`

---

## Phase 2: Database Setup

### Step 2.1: Create Franchise Record

**Run in Supabase SQL Editor:**

\`\`\`sql
-- NOTE: The 'website' column does NOT exist in the franchises table
INSERT INTO franchises (name, description, industry)
VALUES (
  'Franchise Name',
  'Brief description from Item 1',
  'Industry category (e.g., Food Service, Fitness, Beauty)'
)
RETURNING id, name;
\`\`\`

**Save the UUID** - you'll need it for next steps.

> **WARNING:** Do NOT include `website` column - it doesn't exist in the schema.

---

### Step 2.2: Upload Analysis to Supabase

**Set environment variables first:**

\`\`\`bash
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
\`\`\`

**From project root:**

\`\`\`bash
cd ~/Downloads/fdd-advisor/scripts

python3 upload_to_supabase.py \
  --json "pipeline_output/Franchise Name FDD (2025)/analysis.json"
\`\`\`

> **WARNING: DUPLICATE FRANCHISE RISK**  
> The upload script may create a SECOND franchise record with different casing (e.g., "ACE HANDYMAN SERVICES" vs "Ace Handyman Services"). After running, verify:
> \`\`\`sql
> SELECT id, name, created_at FROM franchises 
> WHERE LOWER(name) LIKE '%franchise name%'
> ORDER BY created_at;
> ```
> If duplicates exist, see **Troubleshooting: Duplicate Franchises** section.

**What This Does:**
- Uploads FranchiseScore™ data
- Updates franchise record with scores
- Makes franchise visible in FDDViewer

**Expected Output:**
\`\`\`
📖 Loading analysis.json...
✓ Uploaded FranchiseScore for Franchise Name
✓ Updated franchise record
\`\`\`

---

### Step 2.3: Link Franchisor Account

**Run in Supabase SQL Editor:**

\`\`\`sql
UPDATE franchises 
SET franchisor_id = (
  SELECT fp.id 
  FROM franchisor_profiles fp 
  JOIN auth.users u ON fp.user_id = u.id 
  WHERE u.email = 'franchisor@email.com'
)
WHERE id = 'FRANCHISE_ID_FROM_STEP_2.1';
\`\`\`

This allows the franchisor to manage this franchise from their dashboard.

---

## Phase 3: PDF Upload & Configuration

### Step 3.1: Upload PDF to Supabase Storage

**Manual Upload (Supabase Dashboard):**
1. Go to Supabase Dashboard → Storage → **`fdd-documents`** bucket (NOT `fdd-pdfs`)
2. Click "Upload file"
3. Upload: `Franchise Name FDD (2025).pdf`
4. **Important:** Note the exact filename with spaces/parentheses

> **NOTE:** Use the `fdd-documents` bucket, not `fdd-pdfs` or Vercel Blob.

**After Upload - Get Public URL:**
1. Click on the uploaded file
2. Copy the public URL

**Expected URL format:**
\`\`\`
https://utunvzekehobtyncpcza.supabase.co/storage/v1/object/public/fdd-documents/Franchise%20Name%20FDD%20(2025).pdf
\`\`\`

---

### Step 3.2: Create FDD Record

**Run in Supabase SQL Editor:**

\`\`\`sql
-- Use the franchise_id from Step 2.1
INSERT INTO fdds (
  franchise_id, 
  franchise_name, 
  pdf_url, 
  is_public
)
VALUES (
  'FRANCHISE_ID_FROM_STEP_2.1',
  'Franchise Name',
  'https://utunvzekehobtyncpcza.supabase.co/storage/v1/object/public/fdd-documents/Franchise%20Name%20FDD%20(2025).pdf',
  true
)
RETURNING id, franchise_name;
\`\`\`

**Save the returned FDD ID** - you'll need it for embeddings!

> **CRITICAL:** The `pdf_url` must match the EXACT filename in Storage, including:
> - Spaces (encoded as `%20`)
> - Parentheses (encoded as `%28` and `%29`)
> - Hyphens, underscores, etc.

---

### Step 3.3: Verify FDD Record and Get FDD ID

**Run in Supabase SQL Editor:**

\`\`\`sql
SELECT id, franchise_id, franchise_name, pdf_url 
FROM fdds 
WHERE franchise_id = 'FRANCHISE_ID';
\`\`\`

**Save the `id` value** - this is the FDD ID you need for embeddings (NOT the franchise_id).

---

### Step 3.4: Verify PDF URL Works

**Test in browser:**
\`\`\`
https://utunvzekehobtyncpcza.supabase.co/storage/v1/object/public/fdd-documents/Franchise%20Name%20FDD%20(2025).pdf
\`\`\`

**Expected:** PDF opens in browser  
**If 404:** Filename doesn't match - check Storage bucket for exact name

**Common Issues:**
- Spaces: `Franchise Name` vs `Franchise_Name`
- Parentheses: `(2025)` must be `%282025%29` in URL
- Case sensitivity: `FDD` vs `fdd`

---

## Phase 4: Page Mappings (NEW - Required for FDD Viewer)

### Step 4.1: Create page_mapping.json Manually

**Do NOT copy from another franchise** - page numbers will be completely wrong.

Open the FDD's Table of Contents and create `page_mapping.json`:

\`\`\`json
{
  "items": {
    "1": 8, "2": 9, "3": 12, "4": 13, "5": 14,
    "6": 17, "7": 19, "8": 21, "9": 22, "10": 23,
    "11": 25, "12": 30, "13": 32, "14": 33, "15": 33,
    "16": 33, "17": 34, "18": 35, "19": 50, "20": 61,
    "21": 67, "22": 68, "23": 69
  },
  "exhibits": {
    "A": 71, "B": 155, "C": 163, "D": 167, "E": 171,
    "F": 176, "G": 179, "H": 184, "I": 195, "J": 197,
    "K": 237, "L": 241, "M": 253, "N": 257
  },
  "quick_links": {
    "cover": 1,
    "toc": 7,
    "item19": 50,
    "financial_statements": 69,
    "exhibits": 71
  }
}
\`\`\`

Save to: `pipeline_output/Franchise Name FDD (2025)/page_mapping.json`

---

### Step 4.2: Insert Page Mappings into Database

**First, determine the franchise slug** (lowercase, hyphenated name):
- "Ace Handyman Services" → `ace-handyman-services`
- "Drybar" → `drybar`

**Run in Supabase SQL Editor:**

\`\`\`sql
-- Delete any existing mappings first
DELETE FROM fdd_item_page_mappings WHERE franchise_slug = 'franchise-slug';

-- Insert Items 1-23 (adjust page numbers from your TOC)
INSERT INTO fdd_item_page_mappings (franchise_slug, mapping_type, item_number, label, page_number) VALUES
('franchise-slug', 'item', 1, 'Item 1', 8),
('franchise-slug', 'item', 2, 'Item 2', 9),
('franchise-slug', 'item', 3, 'Item 3', 12),
('franchise-slug', 'item', 4, 'Item 4', 13),
('franchise-slug', 'item', 5, 'Item 5', 14),
('franchise-slug', 'item', 6, 'Item 6', 17),
('franchise-slug', 'item', 7, 'Item 7', 19),
('franchise-slug', 'item', 8, 'Item 8', 21),
('franchise-slug', 'item', 9, 'Item 9', 22),
('franchise-slug', 'item', 10, 'Item 10', 23),
('franchise-slug', 'item', 11, 'Item 11', 25),
('franchise-slug', 'item', 12, 'Item 12', 30),
('franchise-slug', 'item', 13, 'Item 13', 32),
('franchise-slug', 'item', 14, 'Item 14', 33),
('franchise-slug', 'item', 15, 'Item 15', 33),
('franchise-slug', 'item', 16, 'Item 16', 33),
('franchise-slug', 'item', 17, 'Item 17', 34),
('franchise-slug', 'item', 18, 'Item 18', 35),
('franchise-slug', 'item', 19, 'Item 19', 50),
('franchise-slug', 'item', 20, 'Item 20', 61),
('franchise-slug', 'item', 21, 'Item 21', 67),
('franchise-slug', 'item', 22, 'Item 22', 68),
('franchise-slug', 'item', 23, 'Item 23', 69);

-- Insert Exhibits (use FULL exhibit names from the FDD)
INSERT INTO fdd_item_page_mappings (franchise_slug, mapping_type, item_number, label, page_number) VALUES
('franchise-slug', 'exhibit', 1, 'Exhibit A - Franchise Agreement with Exhibits', 71),
('franchise-slug', 'exhibit', 2, 'Exhibit B - Nondisclosure and Noncompetition Agreement', 155),
('franchise-slug', 'exhibit', 3, 'Exhibit C - Statement of Prospective Franchises', 163),
-- ... add all exhibits with their FULL names from the FDD TOC
('franchise-slug', 'exhibit', 14, 'Exhibit N - IGX Participation Agreement', 257);

-- Insert Quick Links
INSERT INTO fdd_item_page_mappings (franchise_slug, mapping_type, item_number, label, page_number) VALUES
('franchise-slug', 'quick_link', 1, 'Cover', 1),
('franchise-slug', 'quick_link', 2, 'Table of Contents', 7),
('franchise-slug', 'quick_link', 3, 'Item 19', 50),
('franchise-slug', 'quick_link', 4, 'Financial Statements', 69),
('franchise-slug', 'quick_link', 5, 'Exhibits', 71);
\`\`\`

> **IMPORTANT:** Each franchise has different exhibit names. Copy the EXACT exhibit names from the FDD's Table of Contents.

---

## Phase 5: Embeddings Generation

### Step 5.1: Generate Embeddings

> **CRITICAL:** Use the **FDD ID** from Step 3.3, NOT the franchise_id!

\`\`\`bash
cd ~/Downloads/fdd-advisor/scripts

python3 enhanced_chunking_for_semantic_search.py \
  "pipeline_output/Franchise Name FDD (2025)" \
  "FDD_ID_FROM_STEP_3.3"
\`\`\`

**Common Error:**
\`\`\`
Foreign key constraint violation: fdd_id references fdds.id
\`\`\`
This means you used franchise_id instead of fdd_id. Get the correct ID:
\`\`\`sql
SELECT id FROM fdds WHERE franchise_id = 'FRANCHISE_ID';
\`\`\`

**Expected Output:**
\`\`\`
======================================================================
SEMANTIC SEARCH CHUNKING: Franchise Name FDD (2025)
======================================================================

Results:
  - 275 chunks stored in Supabase
  - Local reference: pipeline_output/.../semantic_search_chunks.json

Ready for semantic search! 🚀
\`\`\`

**Time:** 3-5 minutes

---

### Step 5.2: Verify Embeddings Quality

**Run in Supabase SQL Editor:**

\`\`\`sql
SELECT 
  fdd_id,
  COUNT(*) as chunk_count,
  MIN(page_number) as min_page,
  MAX(page_number) as max_page
FROM fdd_chunks
WHERE fdd_id = 'FDD_ID'
GROUP BY fdd_id;
\`\`\`

**Expected Results:**
- chunk_count: 200-300 (varies by FDD length)
- min_page: 1
- max_page: Should be close to total FDD pages (e.g., 78 for a 290-page FDD)

> **RED FLAG:** If all chunks show `page_number = 1` or `max_page = 1`:
> - The pipeline only processed the Items folder, not the full PDF
> - AI Chat will NOT be able to answer questions about Exhibits
> - Solution: Re-run pipeline on ENTIRE PDF, then re-generate embeddings

---

## Phase 6: Logo & Branding

### Step 6.1: Get Franchise Logo

**Sources:**
- Official franchise website (preferred)
- Google Images (high resolution)
- Franchise marketing materials

**Requirements:**
- Format: PNG or JPG
- Size: 500x500px minimum
- Background: Transparent PNG preferred
- Quality: High resolution, crisp

---

### Step 6.2: Upload Logo and Update Database

You can use any publicly accessible image URL. Options:

**Option A: Use existing public URL**
\`\`\`sql
UPDATE franchises 
SET logo_url = 'https://example.com/franchise-logo.jpg'
WHERE id = 'FRANCHISE_ID';
\`\`\`

**Option B: Upload to Supabase Storage**
1. Upload to Storage → `franchise-logos` bucket
2. Get public URL
3. Update database with URL

**Verify:**
\`\`\`sql
SELECT name, logo_url 
FROM franchises 
WHERE id = 'FRANCHISE_ID';
\`\`\`

---

## Phase 7: Quality Control - FDDViewer Testing

### Test 7.1: View Franchise Card

**Navigate to:** `/discover`

**Check:**
- [ ] Franchise appears in list
- [ ] Logo displays correctly
- [ ] FranchiseScore shows (e.g., 445/600)
- [ ] Brief description visible
- [ ] Industry tag correct

**Red Flags:**
- Franchise missing from list → Check database upload
- Score shows 0 or null → analysis.json upload failed
- Logo broken → Check logo_url in database

---

### Test 7.2: FDD Viewer Navigation

**Click franchise → View FDD**

**Check:**
- [ ] PDF loads without 404 error
- [ ] Items dropdown shows Items 1-23 (NOT duplicated like "Item 1: Item 1")
- [ ] Exhibits dropdown shows all exhibits with correct names
- [ ] Quick Links work (Cover, TOC, Item 19, etc.)
- [ ] Clicking an Item navigates to correct page

**Red Flags:**
- Items show as "Item 1: Item 1" → Database label format issue
- Exhibits show wrong names → Copied from another franchise
- Navigation goes to wrong page → Page numbers incorrect in mappings

---

### Test 7.3: AI Chat

**Click chat icon**

**Test Questions:**
1. **Investment:** "What is the total investment required?"
2. **Item 19:** "What does Item 19 show about financial performance?"
3. **Training:** "Tell me about the training program"
4. **Exhibits:** "List the franchisees in Virginia" (tests Exhibit coverage)
5. **Litigation:** "Does Item 3 disclose any litigation?"

**Verify Each Response:**
- [ ] Answer is accurate (check against actual FDD)
- [ ] Cites specific Items (e.g., "According to Item 7...")
- [ ] Responds in <5 seconds

**Red Flags:**
- "I don't have information about this franchise" → Embeddings missing
- Can't answer Exhibit questions → Only Items were chunked (not full PDF)
- Hallucinated numbers → Embeddings not matching properly

> **TIP:** If AI Chat can't answer Exhibit questions, enable **Vision Mode** (eye icon) as a workaround. Vision mode analyzes the visible PDF page directly.

---

### Test 7.4: Web Search (Optional)

**Enable Web Search toggle (globe icon)**

**Test Questions:**
- "What are the latest reviews of this franchise?"
- "Any recent news about this franchise?"

**Verify:**
- [ ] Web results appear with sources
- [ ] Source links are clickable

---

## Phase 8: Production Checklist

### Pre-Launch Verification

**Run this comprehensive check:**

\`\`\`sql
SELECT 
  fr.name,
  fr.logo_url,
  fr.franchise_score,
  f.pdf_url,
  f.id as fdd_id,
  (SELECT COUNT(*) FROM fdd_chunks WHERE fdd_id = f.id) as chunks,
  (SELECT COUNT(*) FROM fdd_item_page_mappings WHERE franchise_slug = LOWER(REPLACE(fr.name, ' ', '-'))) as mappings,
  CASE 
    WHEN fr.logo_url IS NULL THEN '❌ Missing logo'
    WHEN f.pdf_url IS NULL THEN '❌ Missing PDF'
    WHEN (SELECT COUNT(*) FROM fdd_chunks WHERE fdd_id = f.id) = 0 THEN '❌ No embeddings'
    WHEN (SELECT COUNT(*) FROM fdd_chunks WHERE fdd_id = f.id) < 100 THEN '⚠️ Low chunk count'
    WHEN (SELECT COUNT(*) FROM fdd_item_page_mappings WHERE franchise_slug = LOWER(REPLACE(fr.name, ' ', '-'))) < 30 THEN '⚠️ Missing page mappings'
    ELSE '✅ Ready'
  END as status
FROM franchises fr
LEFT JOIN fdds f ON fr.id = f.franchise_id
WHERE fr.name = 'Franchise Name';
\`\`\`

**Expected Result:**
\`\`\`
name            | chunks | mappings | status
----------------|--------|----------|----------
Franchise Name  | 275    | 42       | ✅ Ready
\`\`\`

---

### Final Checks

- [ ] FranchiseScore between 300-600
- [ ] All 4 dimension scores populated
- [ ] 3 opportunities + 3 concerns
- [ ] Logo displays correctly
- [ ] PDF loads without errors
- [ ] Items dropdown shows correct labels (not duplicated)
- [ ] Exhibits dropdown shows franchise-specific exhibit names
- [ ] AI Chat answers test questions accurately
- [ ] 200+ chunks in database with proper page ranges
- [ ] Page mappings for all 23 Items, Exhibits, and Quick Links

---

## Troubleshooting

### Issue 1: Duplicate Franchises

**Symptom:** Two franchise entries with different casing

**Cause:** `upload_to_supabase.py` created a second record

**Solution:**
\`\`\`sql
-- Find duplicates
SELECT id, name, created_at, franchise_score 
FROM franchises 
WHERE LOWER(name) LIKE '%franchise name%'
ORDER BY created_at;

-- Check which has data
-- Keep the one WITH franchise_score, delete the empty one

-- If wrong one has data, copy it:
UPDATE franchises dest
SET 
  franchise_score = src.franchise_score,
  franchise_score_breakdown = src.franchise_score_breakdown,
  -- ... copy all score fields
FROM franchises src
WHERE dest.id = 'KEEP_THIS_ID'
  AND src.id = 'DELETE_THIS_ID';

-- Then delete the duplicate
DELETE FROM franchises WHERE id = 'DELETE_THIS_ID';
\`\`\`

---

### Issue 2: Foreign Key Constraint Error (Embeddings)

**Symptom:** `Foreign key constraint violation: fdd_id references fdds.id`

**Cause:** You used `franchise_id` instead of `fdd_id`

**Solution:**
\`\`\`sql
-- Get the correct FDD ID
SELECT id, franchise_id, franchise_name 
FROM fdds 
WHERE franchise_id = 'YOUR_FRANCHISE_ID';

-- Use the 'id' column value, not 'franchise_id'
\`\`\`

---

### Issue 3: AI Chat Can't Answer Exhibit Questions

**Symptom:** AI says "I don't have information" for Exhibit questions, but works for Items

**Cause:** Only Items 1-23 were chunked, not the full PDF

**Solutions:**
1. **Quick fix:** Enable Vision Mode (eye icon) for Exhibit queries
2. **Proper fix:** Re-run pipeline on ENTIRE PDF, delete old chunks, re-generate embeddings

\`\`\`sql
-- Delete old chunks
DELETE FROM fdd_chunks WHERE fdd_id = 'FDD_ID';

-- Then re-run enhanced_chunking_for_semantic_search.py
\`\`\`

---

### Issue 4: Items Dropdown Shows Duplicates ("Item 1: Item 1")

**Symptom:** Dropdown shows "Item 1: Item 1" instead of just "Item 1"

**Cause:** Code was concatenating item number with label

**Solution:** This was fixed in the codebase. If you see this, pull latest code.

---

### Issue 5: Exhibits Show Wrong Names

**Symptom:** Exhibits show another franchise's exhibit names

**Cause:** Copied page mappings from another franchise

**Solution:**
\`\`\`sql
-- Delete wrong mappings
DELETE FROM fdd_item_page_mappings 
WHERE franchise_slug = 'your-franchise-slug'
AND mapping_type = 'exhibit';

-- Insert correct exhibit names from the actual FDD TOC
INSERT INTO fdd_item_page_mappings (...) VALUES (...);
\`\`\`

---

### Issue 6: PDF 404 Error

**Symptom:** PDF Viewer shows "Object not found"

**Cause:** `pdf_url` doesn't match actual filename in Storage

**Solution:**
1. Check exact filename in Supabase Storage → `fdd-documents` bucket
2. Update fdds table with correct URL (remember to URL-encode spaces and special characters)

---

### Issue 7: All Chunks Have page_number = 1

**Symptom:** Query shows all chunks on page 1

**Cause:** Pipeline only processed Items folder content

**Solution:** Re-run pipeline on full PDF to get proper page coverage

---

## Appendix A: File Structure Reference

\`\`\`
fdd-advisor/
├── scripts/
│   ├── vertex_item_by_item_pipeline.py
│   ├── upload_to_supabase.py
│   ├── enhanced_chunking_for_semantic_search.py
│   └── pipeline_output/
│       └── Franchise Name FDD (2025)/
│           ├── items/
│           │   ├── item_01.txt
│           │   └── ... (through 23)
│           ├── analysis.json ← UPLOAD THIS
│           ├── full_text.txt
│           ├── synthesis_debug.txt ← CHECK FOR ERRORS
│           ├── page_mapping.json ← CREATE MANUALLY
│           └── semantic_search_chunks.json ← GENERATED
\`\`\`

---

## Appendix B: Database Schema Quick Reference

### Tables

**franchises** (brand-level)
- id (UUID, PK)
- name
- description
- industry
- logo_url
- franchise_score
- franchisor_id (FK → franchisor_profiles)
- created_at, updated_at

> **NOTE:** No `website` column exists!

**fdds** (document-level)
- id (UUID, PK) ← **USE THIS FOR EMBEDDINGS**
- franchise_id (FK → franchises)
- franchise_name
- pdf_url
- is_public
- created_at, updated_at

**fdd_chunks** (embeddings)
- id (UUID, PK)
- fdd_id (FK → fdds) ← **USE fdds.id, NOT franchise_id**
- chunk_text
- chunk_index
- item_number
- page_number
- token_count
- embedding (vector 768)
- metadata (jsonb)
- created_at

**fdd_item_page_mappings** (navigation)
- id (UUID, PK)
- franchise_slug (e.g., 'ace-handyman-services')
- mapping_type ('item' | 'exhibit' | 'quick_link')
- item_number
- label
- page_number
- created_at

---

## Appendix C: Quick Command Reference

\`\`\`bash
# Process new FDD (run on FULL PDF for best AI Chat coverage)
python3 vertex_item_by_item_pipeline.py --pdf "path/to/FDD.pdf" --output "../pipeline_output/Brand/"

# Set environment variables
export SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"

# Upload analysis
python3 upload_to_supabase.py --json "pipeline_output/Brand/analysis.json"

# Generate embeddings (USE FDD ID, not franchise ID!)
python3 enhanced_chunking_for_semantic_search.py "pipeline_output/Brand" "FDD_UUID_HERE"

# Verify embeddings coverage
# SQL: SELECT COUNT(*), MIN(page_number), MAX(page_number) FROM fdd_chunks WHERE fdd_id = 'UUID';

# Check FranchiseScore
cat "pipeline_output/Brand/analysis.json" | grep '"franchise_score"'

# Check for duplicates
# SQL: SELECT id, name FROM franchises WHERE LOWER(name) LIKE '%brand%';
\`\`\`

---

## Appendix D: Processed Franchises Reference

| Brand | Score | Chunks | Page Range | Status |
|-------|-------|--------|------------|--------|
| Drybar | 548/600 | 275 | 1-78 | ✅ Full coverage |
| Elements Massage | 508/600 | 262 | 1-75 | ✅ Full coverage |
| Ace Handyman Services | 534/600 | 72 | 1-1 | ⚠️ Items only |

---

**End of Guide**

For questions or issues not covered here, check:
- synthesis_debug.txt for pipeline errors
- Supabase logs for database issues
- Browser console for frontend issues

---

*Version 2.0 - Updated December 1, 2025*
*Changes: Fixed schema errors, added page mappings phase, clarified FDD ID vs franchise ID, added troubleshooting for common issues*
