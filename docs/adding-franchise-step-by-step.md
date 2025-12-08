# Adding a New Franchise - Step by Step Guide

This guide breaks down the franchise addition process into individual steps you can run one at a time.

## Prerequisites

Set up your environment variables:

\`\`\`bash
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export BLOB_READ_WRITE_TOKEN="your-blob-token"
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
\`\`\`

## Step 0: Run the Pipeline (You do this locally)

**This is the first step you must complete before proceeding with any uploads.**

Run the AI pipeline locally on your machine to analyze the FDD and generate the structured data:

\`\`\`bash
python3 scripts/vertex_item_by_item_pipeline.py path/to/your-fdd.pdf
\`\`\`

**What this does:**
- Extracts text from the PDF
- Uses AI to analyze and structure the FDD data
- Generates `analysis.json` with all franchise information
- Creates `page_mapping.json` for page references
- Extracts individual items into the `items/` folder

**Output location:**
\`\`\`
pipeline_output/
  └── Your-Franchise-Name/
      ├── analysis.json          # Main structured data
      ├── page_mapping.json      # Page number mappings
      └── items/                 # Extracted item text files
\`\`\`

**Time:** This can take 10-30 minutes depending on the FDD size.

**Once this completes successfully, proceed to Step 1.**

This generates:
- `pipeline_output/Your-Franchise-Name/analysis.json`
- `pipeline_output/Your-Franchise-Name/items/` (extracted text)
- `pipeline_output/Your-Franchise-Name/page_mapping.json`

---

## Step 1: Upload PDF to Supabase Storage

\`\`\`bash
python3 scripts/step1_upload_pdf.py \
  path/to/original-fdd.pdf \
  franchise-slug
\`\`\`

**Example:**
\`\`\`bash
python3 scripts/step1_upload_pdf.py \
  ~/Downloads/blo-fdd.pdf \
  blo-blow-dry-bar
\`\`\`

**Output:** PDF URL (save this for Step 2)

---

## Step 2: Upload Franchise Data

\`\`\`bash
python3 scripts/step2_upload_franchise_data.py \
  pipeline_output/Your-Franchise-Name/analysis.json \
  <pdf_url_from_step_1>
\`\`\`

**Example:**
\`\`\`bash
python3 scripts/step2_upload_franchise_data.py \
  pipeline_output/Blo-Blow-Dry-Bar/analysis.json \
  https://your-project.supabase.co/storage/v1/object/public/fdd-pdfs/blo-blow-dry-bar.pdf
\`\`\`

**Output:** Franchise ID (save this for Step 3)

---

## Step 3: Generate Embeddings for Semantic Search

\`\`\`bash
python3 scripts/step3_generate_embeddings.py \
  pipeline_output/Your-Franchise-Name \
  <fdd_id_from_step_2>
\`\`\`

**Example:**
\`\`\`bash
python3 scripts/step3_generate_embeddings.py \
  pipeline_output/Blo-Blow-Dry-Bar \
  123e4567-e89b-12d3-a456-426614174000
\`\`\`

This processes the PDF text and generates embeddings for the AI chat semantic search.

---

## Step 4: Upload Logo (Optional)

\`\`\`bash
python3 scripts/step4_upload_logo.py \
  path/to/logo.png \
  franchise-slug
\`\`\`

**Example:**
\`\`\`bash
python3 scripts/step4_upload_logo.py \
  logos/blo-logo.png \
  blo-blow-dry-bar
\`\`\`

**Output:** Logo URL

Then update the franchise record in Supabase:
\`\`\`sql
UPDATE franchises 
SET logo_url = 'https://blob.vercel-storage.com/logos/blo-blow-dry-bar.png'
WHERE slug = 'blo-blow-dry-bar';
\`\`\`

---

## Step 5: Map Items and Exhibits (Manual - via Admin UI)

1. Go to `/admin/fdd/[fdd_id]/item-mapping`
2. Use the admin interface to map:
   - Items 1-23 to their page numbers
   - Exhibits to their page numbers
3. This enables "Jump to Items" and "Jump to Exhibits" functionality

---

## Troubleshooting

**If a step fails:**
- Each step is independent - you can re-run just that step
- Check your environment variables are set correctly
- Look at the error message for specific issues

**Common issues:**
- **Step 1:** Make sure the Supabase bucket `fdd-pdfs` exists
- **Step 2:** Verify the PDF URL is accessible
- **Step 3:** Ensure Google Cloud credentials are valid
- **Step 4:** Check BLOB_READ_WRITE_TOKEN is correct

---

## Quick Reference

\`\`\`bash
# Full workflow
python3 scripts/step1_upload_pdf.py path/to/fdd.pdf franchise-slug
python3 scripts/step2_upload_franchise_data.py pipeline_output/Name/analysis.json <pdf_url>
python3 scripts/step3_generate_embeddings.py pipeline_output/Name <fdd_id>
python3 scripts/step4_upload_logo.py path/to/logo.png franchise-slug
