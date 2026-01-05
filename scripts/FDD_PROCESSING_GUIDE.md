# Complete FDD Processing Guide
**FDDAdvisor & FDDHub Production Workflow**

Version: 1.1  
Last Updated: January 5, 2026  
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

```bash
cd ~/Downloads/fdd-advisor/scripts

python3 vertex_item_by_item_pipeline.py \
  --pdf "path/to/Franchise_Name_FDD_2025.pdf" \
  --output "../pipeline_output/Franchise Name FDD (2025)/"
```

**What This Does:**
- Extracts text from PDF using PDFPlumber
- Identifies and separates Items 1-23
- Analyzes each Item using Gemini 2.5 Flash
- Generates FranchiseScore™ with validation
- Creates full_text.txt, items folder, and analysis.json

**Expected Output Files:**
```
pipeline_output/Franchise Name FDD (2025)/
├── items/
│   ├── item_01.txt
│   ├── item_02.txt
│   └── ... (through item_23.txt)
├── analysis.json
├── full_text.txt
└── synthesis_debug.txt
```

**Time:** 8-12 minutes

---

### Step 1.2: Quality Control - FranchiseScore Review

**Open:** `pipeline_output/Franchise Name FDD (2025)/analysis.json`

#### Check 1: Overall Score Reasonability

```bash
# Quick score check
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep '"franchise_score"'
```

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

```bash
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep -A 2 '"total_score"' | head -10
```

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

```bash
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep -A 8 '"System Growth Pattern"'
```

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

```bash
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep -A 8 '"Clean Record"'
```

**Validation Check:**
- 0 cases = 42 points ✅
- 1-2 cases = 35-40 points ✅
- 3-5 cases = 25-30 points ✅
- 6+ cases = 0-20 points ✅

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

```bash
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep -A 8 '"Territory Protection"'
```

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
```json
{
  "title": "Detailed Item 19 Financial Performance Data",
  "description": "Item 19 provides financial performance data for 87 outlets...",
  "citation": "Item 19",
  "impact": "High"
}
```

**Example Bad Opportunity (fix needed):**
```json
{
  "title": "Impressive Financial Transparency",
  "description": "The franchisor demonstrates exceptional commitment...",
  "citation": "Item 19",
  "impact": "High"
}
```

---

#### Check 7: Analytical Summary

**Requirements:**
- 4-5 sentences
- Opens with total score
- Cites specific Items
- No subjective language
- Balanced (mentions both strengths and concerns)

**Forbidden Words to Search For:**
```bash
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep -i "impressive\|robust\|strong\|excellent\|comprehensive\|extensive"
```

If found, validation needs improvement.

---

### Step 1.3: Fix Any Validation Issues

If validation errors found, rerun with fixes:

```bash
# Backup current output
cp "pipeline_output/Franchise Name FDD (2025)/analysis.json" \
   "pipeline_output/Franchise Name FDD (2025)/analysis_backup.json"

# Rerun pipeline (validation fixes already applied)
python3 vertex_item_by_item_pipeline.py \
  --pdf "path/to/Franchise_Name_FDD_2025.pdf" \
  --output "../pipeline_output/Franchise Name FDD (2025)/"
```

---

## Phase 2: Database Setup

### Step 2.1: Get Franchise ID

**Run in Supabase SQL Editor:**

```sql
SELECT id, name 
FROM franchises 
WHERE name = 'Franchise Name Here'
ORDER BY name;
```

**If franchise doesn't exist, create it:**

```sql
INSERT INTO franchises (name, description, industry, website)
VALUES (
  'Franchise Name',
  'Brief description from Item 1',
  'Industry category (e.g., Food Service, Fitness, Beauty)',
  'https://franchisewebsite.com'
)
RETURNING id, name;
```

**Save the UUID** - you'll need it for next steps.

---

### Step 2.2: Upload Analysis to Supabase

**From project root:**

```bash
cd ~/Downloads/fdd-advisor/scripts

python3 upload_to_supabase.py \
  --json "pipeline_output/Franchise Name FDD (2025)/analysis.json"
```

**What This Does:**
- Uploads FranchiseScore™ data
- Updates franchise record with scores
- Makes franchise visible in FDDViewer

**Expected Output:**
```
📖 Loading analysis.json...
✓ Uploaded FranchiseScore for Franchise Name
✓ Updated franchise record
```

---

## Phase 3: PDF Upload & Configuration

### Step 3.1: Upload PDF to Supabase Storage

**Manual Upload (Supabase Dashboard):**
1. Go to Supabase Dashboard → Storage → `fdd-documents` bucket
2. Click "Upload file"
3. Upload: `Franchise Name FDD (2025).pdf`
4. **Important:** Note the exact filename with spaces/parentheses

**Programmatic Upload (if scripted):**
```bash
# Example using Supabase CLI
supabase storage upload fdd-documents "Franchise Name FDD (2025).pdf"
```

**Expected Result:**
- File visible in Storage bucket
- URL format: `https://[PROJECT].supabase.co/storage/v1/object/public/fdd-documents/Franchise%20Name%20FDD%20(2025).pdf`

---

### Step 3.2: Create FDD Record

**Run in Supabase SQL Editor:**

```sql
-- Use the franchise_id from Step 2.1
INSERT INTO fdds (
  franchise_id, 
  franchise_name, 
  pdf_url, 
  pdf_path, 
  is_public
)
VALUES (
  'FRANCHISE_ID_FROM_STEP_2.1',
  'Franchise Name',
  'https://utunvzekehobtyncpcza.supabase.co/storage/v1/object/public/fdd-documents/Franchise%20Name%20FDD%20(2025).pdf',
  'Franchise Name FDD (2025).pdf',
  true
)
RETURNING id, franchise_name;
```

**Save the returned FDD ID** - you'll need it for embeddings!

**Critical:** The `pdf_url` must match the EXACT filename in Storage, including:
- Spaces (encoded as `%20`)
- Parentheses (encoded as `%28` and `%29`)
- Hyphens, underscores, etc.

---

### Step 3.3: Verify PDF URL Works

**Test in browser:**
```
https://utunvzekehobtyncpcza.supabase.co/storage/v1/object/public/fdd-documents/Franchise%20Name%20FDD%20(2025).pdf
```

**Expected:** PDF opens in browser  
**If 404:** Filename doesn't match - check Storage bucket for exact name

**Common Issues:**
- Spaces: `Franchise Name` vs `Franchise_Name`
- Parentheses: `(2025)` must be `%282025%29` in URL
- Case sensitivity: `FDD` vs `fdd`

---

## Phase 4: Embeddings Generation

### Step 4.1: Copy Page Mapping (Temporary Solution)

Until pipeline generates page_mapping.json automatically:

```bash
cd ~/Downloads/fdd-advisor

# Copy from a franchise that has it (e.g., Drybar)
cp "scripts/pipeline_output/Top400 - 284 - Drybar/page_mapping.json" \
   "scripts/pipeline_output/Franchise Name FDD (2025)/"
```

**Note:** Page numbers won't be 100% accurate, but close enough for demo. FDDs follow standard order.

---

### Step 4.2: Generate Embeddings

**Use the FDD ID from Step 3.2:**

```bash
cd ~/Downloads/fdd-advisor

python3 scripts/enhanced_chunking_for_semantic_search.py \
  "scripts/pipeline_output/Franchise Name FDD (2025)" \
  "FDD_ID_FROM_STEP_3.2"
```

**What This Does:**
- Reads items from `items/` folder
- Creates ~600-token chunks with overlap
- Generates 768-dimensional embeddings using Gemini
- Uploads chunks to `fdd_chunks` table
- Saves local reference file

**Expected Output:**
```
======================================================================
SEMANTIC SEARCH CHUNKING: Franchise Name FDD (2025)
======================================================================

Loading page mappings...
  ✓ Found mappings for 19 Items

Reading individual Item files from items/...
  Processing Item 1: ITEM 1: THE FRANCHISOR...
  Processing Item 2: ITEM 2: BUSINESS EXPERIENCE...
  [...]
  ✓ Created 275 chunks
  ✓ Avg tokens per chunk: 612

Generating embeddings for 275 chunks...
  Processing batch 1/55...
  Processing batch 2/55...
  [...]
  ✓ All embeddings generated

Storing 275 chunks in Supabase...
  ✓ Stored 275 chunks successfully

======================================================================
✓ SEMANTIC SEARCH CHUNKING COMPLETE
======================================================================

Ready for semantic search! 🚀
```

**Time:** 3-5 minutes

**Common Issues:**
- `FileNotFoundError: Items directory not found` → Check path is correct
- `Foreign key constraint violation` → Wrong FDD ID (use FDD table ID, not franchise ID)
- `Authentication error` → Check `.env` has `GOOGLE_APPLICATION_CREDENTIALS`

---

### Step 4.3: Verify Embeddings in Database

**Run in Supabase SQL Editor:**

```sql
SELECT 
  f.franchise_name,
  COUNT(c.id) as chunk_count,
  MIN(c.created_at) as first_chunk,
  MAX(c.created_at) as last_chunk
FROM fdds f
LEFT JOIN fdd_chunks c ON f.id = c.fdd_id
WHERE f.franchise_name = 'Franchise Name'
GROUP BY f.franchise_name;
```

**Expected:**
- chunk_count: 250-300 (varies by FDD length)
- first_chunk and last_chunk: Same timestamp (bulk insert)

**Red Flags:**
- chunk_count = 0 (embeddings failed)
- chunk_count < 100 (Items missing or extraction failed)

---

## Phase 5: Logo & Branding

### Step 5.1: Get Franchise Logo

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

### Step 5.2: Upload Logo via v0.app

**Ask v0:**
```
"Upload the logo for [Franchise Name] to Supabase Storage and update the franchises table with the logo URL"
```

**v0 will:**
1. Upload logo to `franchise-logos` bucket
2. Update `franchises` table with `logo_url`
3. Confirm upload successful

**Verify:**
```sql
SELECT name, logo_url 
FROM franchises 
WHERE name = 'Franchise Name';
```

---

## Phase 6: Quality Control - FDDViewer Testing

### Test 6.1: View Franchise Card

**Navigate to:** `http://localhost:3000`

**Check:**
- ✅ Franchise appears in list
- ✅ Logo displays correctly
- ✅ FranchiseScore shows (e.g., 445/600)
- ✅ Brief description visible
- ✅ Industry tag correct

**Red Flags:**
- Franchise missing from list → Check database upload
- Score shows 0 or null → analysis.json upload failed
- Logo broken → Check logo_url in database

---

### Test 6.2: FranchiseScore Details

**Click franchise card → View Details**

**Check All 4 Dimensions:**
1. **Financial Transparency (150 max)**
   - Item 19 Quality score
   - Investment Clarity score
   - Fee Structure Transparency score
   
2. **System Strength (150 max)**
   - System Growth Pattern score ← **CRITICAL CHECK**
   - Franchisor Longevity score
   - Clean Record score
   
3. **Franchisee Support (150 max)**
   - Training Program Quality score
   - Operational Support score
   - Territory Protection score
   
4. **Business Foundation (150 max)**
   - Management Experience score
   - Item 19 Performance Indicators score
   - System Performance score

**Verify:**
- All metrics have scores (not null)
- Explanations reference specific Items
- Formulas are shown
- Ratings make sense (Excellent/Good/Fair/Poor)

---

### Test 6.3: Opportunities & Concerns

**Check:**
- ✅ Exactly 3 opportunities
- ✅ Exactly 3 concerns
- ✅ Each has Item citation
- ✅ Impact level shown (High/Medium/Low)
- ✅ Descriptions are factual, not subjective

**Red Flags:**
- Empty opportunities/concerns → Synthesis failed
- Subjective language ("impressive", "robust") → Validation needs fixing
- Missing citations → Data extraction issue

---

### Test 6.4: PDF Viewer

**Click "View FDD PDF"**

**Check:**
- ✅ PDF loads without 404 error
- ✅ All pages visible
- ✅ Zoom in/out works
- ✅ Page navigation works
- ✅ Search function works (if implemented)

**Red Flags:**
- 404 error → PDF URL wrong (check Step 3.3)
- PDF loads but is corrupted → Re-upload PDF
- Very slow loading → File too large or CDN issue

---

### Test 6.5: AI Chat

**Click "Ask AI" or Chat button**

**Test Questions:**
1. **Investment:** "What is the total investment required?"
2. **Item 19:** "What does Item 19 show about financial performance?"
3. **Training:** "Tell me about the training program"
4. **Growth:** "How many units opened and closed last year?"
5. **Litigation:** "Does Item 3 disclose any litigation?"

**Verify Each Response:**
- ✅ Answer is accurate (check against actual FDD)
- ✅ Cites specific Items (e.g., "According to Item 7...")
- ✅ Uses data from embeddings (not hallucinating)
- ✅ Responds in <5 seconds
- ✅ Provides page numbers when relevant

**Red Flags:**
- "I don't have information about this franchise" → Embeddings missing
- Answers about wrong franchise → Chunk attribution error
- Hallucinated numbers → Embeddings not matching properly
- Very slow (>10 seconds) → Vector search performance issue

---

### Test 6.6: Franchise Description Review

**Navigate to:** Franchise detail page

**Check the franchise description (generated by AI):**

**Forbidden Subjective Language:**
- ❌ "impressive", "robust", "strong", "excellent", "comprehensive"
- ❌ "exceptional", "outstanding", "remarkable", "extensive"
- ❌ "significant", "substantial", "notable", "considerable"
- ❌ "attractive", "favorable", "promising", "compelling"

**Search for violations:**
```bash
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep -E "impressive|robust|strong|excellent|comprehensive|exceptional|outstanding|remarkable|extensive|significant|substantial|notable|considerable|attractive|favorable|promising|compelling"
```

**If found, revise through v0.app:**
```
"The franchise description for [Franchise Name] contains subjective language. 
Please revise it to use only neutral, factual language. Replace:
- 'impressive growth' → 'Added 151 units over 12 months'
- 'robust support' → 'Quarterly field visits with 24/7 hotline'
- 'comprehensive training' → '10-12 week initial training program'

Keep all facts and numbers, just remove subjective adjectives."
```

**Good Example (Neutral):**
> "Drybar operates 176 locations as of 2024, with 17 net new units opened during the year. Item 19 provides financial performance data for 146 outlets (83% of system). The franchise offers 58 hours of initial training covering 21 operational topics."

**Bad Example (Too Subjective):**
> "Drybar is an impressive franchise with robust growth and a comprehensive training program. The company demonstrates exceptional financial transparency with outstanding Item 19 disclosure."

---

## Phase 7: Production Checklist

### Pre-Launch Verification

**Run this comprehensive check:**

```sql
-- Verify franchise is fully configured
SELECT 
  fr.name,
  fr.logo_url,
  fr.franchise_score,
  f.pdf_url,
  COUNT(c.id) as chunks,
  CASE 
    WHEN fr.logo_url IS NULL THEN '❌ Missing logo'
    WHEN f.pdf_url IS NULL THEN '❌ Missing PDF'
    WHEN COUNT(c.id) = 0 THEN '❌ No embeddings'
    WHEN COUNT(c.id) < 200 THEN '⚠️ Low chunk count'
    ELSE '✅ Ready'
  END as status
FROM franchises fr
LEFT JOIN fdds f ON fr.id = f.franchise_id
LEFT JOIN fdd_chunks c ON f.id = c.fdd_id
WHERE fr.name = 'Franchise Name'
GROUP BY fr.name, fr.logo_url, fr.franchise_score, f.pdf_url;
```

**Expected Result:**
```
name            | status
----------------|----------
Franchise Name  | ✅ Ready
```

---

### Final Checks

- [ ] FranchiseScore between 300-600
- [ ] All 4 dimension scores populated
- [ ] 3 opportunities + 3 concerns
- [ ] Franchise description uses neutral language (no subjective words)
- [ ] Logo displays correctly
- [ ] PDF loads without errors
- [ ] AI Chat answers 5 test questions accurately
- [ ] 200+ chunks in database
- [ ] No validation errors in synthesis_debug.txt
- [ ] Analytical summary is neutral and balanced

---

## Common Issues & Solutions

### Issue 1: Negative Scores

**Symptom:** FranchiseScore shows negative numbers

**Cause:** Claude invented penalty formulas instead of using rubric

**Solution:**
```bash
# Check synthesis_debug.txt for the metric
cat "pipeline_output/Franchise Name FDD (2025)/synthesis_debug.txt" | grep -A 10 "metric_name"

# Validation should catch and fix this automatically
# If not, rerun pipeline with updated validation
```

---

### Issue 2: PDF 404 Error

**Symptom:** PDF Viewer shows "Object not found"

**Cause:** `pdf_url` doesn't match actual filename in Storage

**Solution:**
1. Check exact filename in Storage bucket
2. Update fdds table:
```sql
UPDATE fdds 
SET pdf_url = 'https://[PROJECT].supabase.co/storage/v1/object/public/fdd-documents/Exact%20Filename%20(2025).pdf'
WHERE franchise_name = 'Franchise Name';
```

Remember to URL-encode spaces and special characters!

---

### Issue 3: AI Chat Returns Nothing

**Symptom:** "I don't have information about this franchise"

**Cause:** Embeddings not generated or wrong FDD ID used

**Solution:**
```sql
-- Check if chunks exist
SELECT COUNT(*) FROM fdd_chunks 
WHERE fdd_id = (
  SELECT id FROM fdds WHERE franchise_name = 'Franchise Name'
);
```

If count = 0, rerun Step 4.2 with correct FDD ID.

---

### Issue 4: Territory Protection Score Mismatch

**Symptom:** Score is 42 but explanation mentions "exceptions"

**Cause:** Validation bug - Claude scored 42 but description says limited protection

**Solution:**
Validation should auto-fix this. If not:
```bash
# Check the actual explanation
cat "pipeline_output/Franchise Name FDD (2025)/analysis.json" | grep -A 10 '"Territory Protection"'

# Should be 24 points if there are e-commerce exceptions
# Rerun pipeline if validation didn't catch it
```

---

### Issue 5: System Growth Score Too High

**Symptom:** Franchise has net negative growth but scores 60/60

**Cause:** Validation didn't detect declining system

**Solution:**
Check Item 20 data manually:
```bash
cat "pipeline_output/Franchise Name FDD (2025)/items/item_20.txt"
```

Calculate:
- Closure Rate = (Closures ÷ Total Units) × 100
- If >10%, should score 12 points, not 60
- Rerun with validation fix

---

## Appendix A: File Structure Reference

```
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
│           ├── page_mapping.json ← COPY FROM DRYBAR
│           └── semantic_search_chunks.json ← GENERATED
```

---

## Appendix B: Database Schema Quick Reference

### Tables

**franchises** (brand-level)
- id (UUID, PK)
- name
- description
- industry
- website
- logo_url
- franchise_score
- created_at, updated_at

**fdds** (document-level)
- id (UUID, PK)
- franchise_id (FK → franchises)
- franchise_name
- pdf_url
- pdf_path
- is_public
- chunks_processed
- chunk_count
- created_at, updated_at

**fdd_chunks** (embeddings)
- id (UUID, PK)
- fdd_id (FK → fdds) ← **USE THIS, NOT FRANCHISE_ID**
- chunk_text
- chunk_index
- item_number
- page_number
- start_page, end_page
- token_count
- embedding (vector 768)
- metadata (jsonb)
- created_at

---

## Appendix C: Score Interpretation Guide

### FranchiseScore Ranges

| Score | Grade | Interpretation |
|-------|-------|----------------|
| 550-600 | A+ | Exceptional (very rare - verify data) |
| 500-549 | A | Excellent franchise opportunity |
| 450-499 | B+ | Good franchise with strong fundamentals |
| 400-449 | B | Solid franchise with some concerns |
| 350-399 | C+ | Fair franchise, significant due diligence needed |
| 300-349 | C | Concerning franchise, high risk |
| <300 | D-F | High-risk, likely system in crisis |

### System Health Red Flags

**Immediate Red Flags (Do Not Invest):**
- Closure rate >30% (Amazing Lash: 34.8%)
- 3-year declining trend with no turnaround
- Bankruptcy in Items 3-4
- Fraud allegations in litigation

**Yellow Flags (Investigate Further):**
- Closure rate 10-20%
- Net negative growth 2+ years
- 5+ recent litigation cases
- No Item 19 financial disclosure

**Green Flags (Healthy System):**
- Closure rate <5%
- Net positive growth
- Clean litigation record (0-2 minor cases)
- Detailed Item 19 with strong performance

---

## Appendix D: Validation Rules Reference

### Clean Record (Items 3-4)

**Scoring Rubric:**
- 0 cases → 42 points
- 1-2 cases → 35-40 points
- 3-5 cases → 25-30 points
- 6+ cases → 0-20 points

**3-Year Recency Filter:**
- Count cases filed 2022-2025
- OR older cases still ongoing/pending
- Exclude pre-2022 resolved cases

**Common Validation Fixes:**
- -48 points → 25 points (9 cases with recency filter)
- 0 points → 42 points (clean record not recognized)

### Territory Protection (Item 12)

**Scoring Rubric:**
- 42 points: Full exclusive territory
- 36 points: Protected with minor exceptions
- 24 points: Limited (e-commerce exceptions) ← **Most common**
- 6 points: No protection

**Common Validation Fixes:**
- 42 points → 24 points (missed e-commerce exceptions in text)
- Score/formula mismatch (formula says 24, score shows 42)

### System Growth Pattern (Item 20)

**Scoring Rubric:**
- 60 points: Net positive growth, <5% closure rate
- 36 points: Flat growth, 5-10% closure rate
- 12 points: Net negative growth, >10% closure rate

**Required Calculations:**
```
Net Growth Rate = ((Opened - Closed) ÷ Starting Units) × 100
Closure Rate = (Closed ÷ Total Units) × 100
```

**Common Validation Fixes:**
- 0 points → 12 points (declining system recognized)
- 60 points → 12 points (validation missed closures)

---

## Appendix E: Quick Command Reference

```bash
# Process new FDD
python3 vertex_item_by_item_pipeline.py --pdf "path/to/FDD.pdf" --output "../pipeline_output/Brand/"

# Upload analysis
python3 upload_to_supabase.py --json "pipeline_output/Brand/analysis.json"

# Generate embeddings (use FDD ID, not franchise ID!)
python3 enhanced_chunking_for_semantic_search.py "scripts/pipeline_output/Brand" "FDD_UUID_HERE"

# Verify embeddings
# SQL: SELECT COUNT(*) FROM fdd_chunks WHERE fdd_id = 'UUID';

# Check FranchiseScore
cat "pipeline_output/Brand/analysis.json" | grep '"franchise_score"'

# Find validation issues
cat "pipeline_output/Brand/synthesis_debug.txt" | grep "FIX"

# Test PDF URL
# Browser: https://[PROJECT].supabase.co/storage/v1/object/public/fdd-documents/Brand%20FDD%20(2025).pdf
```

---

## Appendix F: WellBiz Portfolio Reference

**Successfully Processed (November 4, 2025):**

| Brand | Score | Status | Chunks |
|-------|-------|--------|--------|
| Drybar | 548/600 | ✅ Healthy (0 closures) | 275 |
| Elements Massage | 508/600 | 🆗 Stable (-11 units) | 262 |
| Radiant Waxing | 452/600 | ⚠️ Declining | 265 |
| Amazing Lash Studio | 445/600 | 🚨 Crisis (70 closures!) | 278 |
| Fitness Together | 429/600 | ⚠️ Declining | 266 |

**Total:** 1,346 chunks processed

**Key Learnings:**
- 3-year recency filter essential for fair litigation scoring
- System Growth Pattern is the most critical metric
- Territory Protection commonly scores 24/42 (e-commerce exceptions)
- Amazing Lash case study: high transparency score (138/150) but system crisis (85/150 system strength)

---

## Appendix G: Ace Handyman Processing Notes (January 2026)

**Processing Date:** January 2026

**Key Observations:**
- Full FDD with Items 1-23 processed successfully
- Page mapping generated manually
- Embeddings generated with correct FDD ID

**Lessons Learned:**
- Always verify FDD ID vs Franchise ID when generating embeddings
- Check synthesis_debug.txt for any validation overrides
- The 3-year recency filter is critical for accurate litigation scoring

---

**End of Guide**

For questions or issues not covered here, check:
- synthesis_debug.txt for pipeline errors
- Supabase logs for database issues
- Browser console for frontend issues
- Ask Claude for help with specific issues

---

*Document maintained by Paralex, Inc.*  
*Version 1.1 - January 5, 2026*
