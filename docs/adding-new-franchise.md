# Adding a New Franchise to FDDAdvisor

This guide walks through the complete process of adding a new franchise to the platform.

## Prerequisites

1. **Environment Variables Set:**
   \`\`\`bash
   export SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   export BLOB_READ_WRITE_TOKEN="your-blob-token"
   export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
   export GOOGLE_CLOUD_PROJECT="your-gcp-project-id"
   \`\`\`

2. **Python Dependencies Installed:**
   \`\`\`bash
   pip install supabase google-auth google-auth-oauthlib google-auth-httplib2 requests tiktoken python-dotenv
   \`\`\`

3. **FDD PDF File Ready**

## Quick Start (Recommended)

Use the all-in-one helper script:

\`\`\`bash
python3 scripts/add_new_franchise.py \
  --pipeline-dir pipeline_output/Your-Franchise-Name \
  --logo path/to/logo.png
\`\`\`

This will:
1. ✅ Upload franchise data to Supabase
2. ✅ Get the franchise ID
3. ✅ Process and upload embeddings for semantic search
4. ✅ Upload the logo to Vercel Blob

## Manual Process (Step-by-Step)

If you prefer to run each step manually:

### Step 1: Run the Analysis Pipeline

Process the FDD PDF to extract data and generate analysis:

\`\`\`bash
python3 scripts/vertex_item_by_item_pipeline.py path/to/your-fdd.pdf
\`\`\`

**Output:**
- `pipeline_output/Your-Franchise-Name/analysis.json` - Complete franchise analysis
- `pipeline_output/Your-Franchise-Name/items/` - Extracted Item text files
- `pipeline_output/Your-Franchise-Name/page_mapping.json` - Page number mappings

### Step 2: Upload to Supabase

Upload the franchise data to your database:

\`\`\`bash
python3 scripts/upload_to_supabase.py \
  --json pipeline_output/Your-Franchise-Name/analysis.json
\`\`\`

**What it does:**
- Creates or updates franchise record in `franchises` table
- Includes FranchiseScore breakdown, opportunities, concerns, etc.

### Step 3: Get the Franchise ID

Query Supabase to get the franchise UUID:

\`\`\`sql
SELECT id, name FROM franchises WHERE name = 'Your Franchise Name';
\`\`\`

Or use the Supabase dashboard to find the ID.

### Step 4: Process Embeddings

Generate semantic search embeddings for the AI chat:

\`\`\`bash
python3 scripts/enhanced_chunking_for_semantic_search.py \
  pipeline_output/Your-Franchise-Name \
  <franchise-id-from-step-3>
\`\`\`

**What it does:**
- Chunks the FDD text into semantic segments
- Generates 768-dimensional embeddings using Gemini text-embedding-004
- Stores chunks and embeddings in `fdd_chunks` table

### Step 5: Upload Logo

Upload the franchise logo to Vercel Blob storage and update the database:

\`\`\`bash
# Upload via API or admin interface
# Then update the franchise record:
UPDATE franchises 
SET logo_url = 'https://blob.vercel-storage.com/logos/your-franchise.png'
WHERE id = '<franchise-id>';
\`\`\`

### Step 6: Upload FDD Page Images (Optional)

If you want the PDF viewer to work, upload page images:

1. Convert PDF pages to PNG/JPG images
2. Use the admin interface at `/admin/fdd-processing`
3. Or use the upload API endpoint

## Verification

After adding the franchise, verify:

1. **Franchise appears in discovery tool** - Check `/buyer` page
2. **FDD viewer works** - Navigate to `/fdd/your-franchise-slug`
3. **AI chat responds** - Test semantic search in the FDD viewer
4. **Logo displays** - Check franchise card and detail pages
5. **FranchiseScore shows** - Verify all 4 categories display correctly

## Troubleshooting

### "Franchise not found in database"
- Check that Step 2 (upload_to_supabase.py) completed successfully
- Verify the franchise name matches exactly

### "Embeddings generation failed"
- Ensure `GOOGLE_APPLICATION_CREDENTIALS` is set correctly
- Check that the service account has Vertex AI permissions
- Verify `items/` folder exists with item_01.txt through item_23.txt

### "Logo not uploading"
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check that the logo file exists and is a valid image format
- Ensure the file size is reasonable (< 5MB recommended)

### "AI Chat not working"
- Verify embeddings were generated (check `fdd_chunks` table)
- Ensure the `fdd_id` matches the franchise ID
- Check that chunks have non-zero embeddings

## File Structure

After processing, you should have:

\`\`\`
pipeline_output/Your-Franchise-Name/
├── analysis.json                    # Complete franchise analysis
├── items/
│   ├── item_01.txt                 # Item 1 extracted text
│   ├── item_02.txt                 # Item 2 extracted text
│   └── ...                         # Items 3-23
├── page_mapping.json               # Page number mappings
└── semantic_search_chunks.json     # Generated chunks (reference)
\`\`\`

## Notes

- The pipeline uses Gemini 2.0 Flash for analysis
- Embeddings use text-embedding-004 (768 dimensions)
- FranchiseScore is calculated on a 600-point scale
- All data is stored in Supabase PostgreSQL
- Logos are stored in Vercel Blob storage
