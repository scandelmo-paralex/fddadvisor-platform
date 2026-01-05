# Scripts Directory

> FDD processing scripts, database migrations, and utility tools

## Overview

This directory contains Python scripts for FDD processing, SQL migration files, and various utility scripts for managing the platform.

## Directory Structure

```
scripts/
├── FDD_PROCESSING_GUIDE.md    # Complete processing workflow guide
├── *.sql                       # Database migrations (numbered)
├── *.py                        # Python processing scripts
├── *.md                        # Documentation
└── *.ts                        # TypeScript utilities
```

## FDD Processing Pipeline

### Main Scripts

| Script | Description |
|--------|-------------|
| `vertex_item_by_item_pipeline.py` | Main FDD analysis pipeline using Gemini AI |
| `upload_to_supabase.py` | Upload analysis.json to database |
| `enhanced_chunking_for_semantic_search.py` | Generate embeddings for AI chat |

### Processing Workflow

```bash
# 1. Analyze FDD (15-20 min)
python3 vertex_item_by_item_pipeline.py \
  --pdf "path/to/FDD.pdf" \
  --output "../pipeline_output/Franchise Name/"

# 2. Upload to database
python3 upload_to_supabase.py \
  --json "pipeline_output/Franchise Name/analysis.json"

# 3. Generate embeddings (use FDD_ID, not franchise_id!)
python3 enhanced_chunking_for_semantic_search.py \
  "pipeline_output/Franchise Name" \
  "FDD_UUID_FROM_STEP_2"
```

### Output Files

```
pipeline_output/Franchise Name/
├── analysis.json           # FranchiseScore data (upload this)
├── items/                  # Extracted Item text files
│   ├── item_01.txt
│   └── ... (through 23)
├── full_text.txt          # Complete extracted text
├── synthesis_debug.txt    # Validation log
└── page_mapping.json      # Page number mappings
```

## Database Migrations

Migration files are numbered sequentially:

```
00-complete-database-setup.sql    # Full initial setup
01-create-tables.sql              # Core tables
02-row-level-security.sql         # RLS policies
...
112-create-franchisor-team-members.sql  # Team management
117-add-years-experience-range-field.sql  # Latest
```

### Running Migrations

Run in Supabase SQL Editor in order. Check existing migrations before running:

```sql
-- Check what's already applied
SELECT * FROM pg_tables WHERE schemaname = 'public';
```

## Key Scripts

### Processing Scripts

| Script | Purpose |
|--------|---------|
| `vertex_item_by_item_pipeline.py` | Main FDD → FranchiseScore pipeline |
| `enhanced_chunking_for_semantic_search.py` | Generate vector embeddings |
| `upload_to_supabase.py` | Upload analysis to database |
| `generate_page_mapping.py` | Create Item→page mappings |
| `batch-process-fdds.py` | Process multiple FDDs |

### Data Sync Scripts

| Script | Purpose |
|--------|---------|
| `sync_data_v7.py` | Sync data between environments |
| `sync_embeddings_batch.py` | Batch sync embeddings |
| `sync-production-to-staging.mjs` | Copy prod → staging |

### Update Scripts

| Script | Purpose |
|--------|---------|
| `update_franchise_pdf_urls.py` | Fix PDF URLs in database |
| `update_franchise_logos.py` | Update logo URLs |
| `fetch_supabase_storage_urls.py` | List storage URLs |

## Environment Setup

Required environment variables:

```bash
# Supabase
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="xxx"

# Google Cloud (for Gemini AI)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export GOOGLE_CLOUD_PROJECT="your-project-id"
```

## Python Dependencies

```bash
pip install pdfplumber google-generativeai supabase tiktoken python-dotenv
```

## Documentation

| File | Description |
|------|-------------|
| `FDD_PROCESSING_GUIDE.md` | Complete step-by-step guide |
| `BULK_PROCESSING_GUIDE.md` | Processing multiple FDDs |
| `VERTEX_AI_SETUP.md` | Google Cloud setup |
| `VERTEX_PIPELINE_SETUP.md` | Pipeline configuration |
| `GOOGLE_CLOUD_SETUP_GUIDE.md` | GCP credentials |
| `TESTING_GUIDE.md` | Testing procedures |

## Common Tasks

### Process New Franchise

See `FDD_PROCESSING_GUIDE.md` for complete instructions.

### Fix Missing Embeddings

```bash
python3 enhanced_chunking_for_semantic_search.py \
  "pipeline_output/Franchise Name" \
  "FDD_UUID"
```

### Update PDF URLs

```bash
python3 update_franchise_pdf_urls.py
```

### Sync to Staging

```bash
node sync-production-to-staging.mjs
```

## Quality Control

After processing, verify:
- [ ] FranchiseScore between 300-600
- [ ] All 4 dimensions populated
- [ ] 3 opportunities + 3 concerns
- [ ] 200+ chunks in database
- [ ] AI chat responds correctly
- [ ] PDF viewer loads

## Related Documentation

- [Cloud Processing Guide](/CLOUD_FDD_PROCESSING_GUIDE.md)
- [FranchiseScore Methodology](/FRANCHISESCORE_METHODOLOGY_2_1.md)
- [Database Schema](/docs/DATABASE-SCHEMA.md)
