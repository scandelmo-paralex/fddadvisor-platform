# Vertex AI Complete Pipeline Setup

## Overview

This pipeline processes FDD PDFs end-to-end using Google Vertex AI:

1. **PDF Text Extraction** - Vertex AI Document AI extracts full text with page numbers
2. **Smart Exhibit Detection** - Identifies financial exhibits referenced in Item 19
3. **DeepSeek Analysis** - Analyzes Items 1-22 + financial exhibits
4. **Supabase Storage** - Stores structured data in your database
5. **Vector DB Prep** - Chunks text for semantic search

## Prerequisites

### 1. Enable Google Cloud APIs

\`\`\`bash
gcloud services enable documentai.googleapis.com
gcloud services enable aiplatform.googleapis.com
\`\`\`

### 2. Create Document AI Processor

1. Go to Google Cloud Console → Document AI
2. Click "Create Processor"
3. Select "Document OCR"
4. Note the Processor ID

### 3. Install Dependencies

\`\`\`bash
pip install google-cloud-documentai google-cloud-aiplatform supabase requests tqdm
\`\`\`

### 4. Set Environment Variables

\`\`\`bash
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_KEY="your-service-key"
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
\`\`\`

## Configuration

Edit `scripts/vertex_complete_pipeline.py`:

\`\`\`python
PROJECT_ID = "your-project-id"
LOCATION = "us-central1"
PROCESSOR_ID = "your-processor-id"  # From step 2 above
PDF_INPUT_DIR = "./test_pdfs"  # Put your test PDF here
\`\`\`

## Running the Pipeline

### Test with Single PDF

\`\`\`bash
# 1. Create test directory and add a PDF
mkdir test_pdfs
cp "path/to/your/test-fdd.pdf" test_pdfs/

# 2. Run the pipeline
python scripts/vertex_complete_pipeline.py
\`\`\`

### What Happens

The pipeline will:
1. Extract all text from the PDF (preserving page numbers)
2. Identify Items 1-22 section
3. Detect financial exhibits referenced in Item 19 (e.g., "see Exhibit H")
4. Extract only those financial exhibits (ignoring legal agreements)
5. Send Items 1-22 + financial exhibits to DeepSeek for analysis
6. Store structured results in Supabase
7. Create text chunks for vector database

### Output Structure

\`\`\`
pipeline_output/
└── YourFranchiseName/
    ├── full_text.txt              # Complete PDF text
    ├── items_1_to_22.txt          # Core FDD items
    ├── financial_exhibits.json    # Extracted exhibits
    ├── page_mapping.json          # Item → Page mapping
    ├── analysis.json              # Structured analysis
    └── vector_chunks.json         # Ready for vector DB
\`\`\`

## Viewing Results

### Check Supabase

\`\`\`sql
SELECT name, franchise_score, has_item19, total_units
FROM franchises
ORDER BY created_at DESC
LIMIT 1;
\`\`\`

### View in FDD Viewer

1. The data is now in your Supabase database
2. Refresh the `/discover` page
3. Click on the franchise to view in FDD Viewer

## Next Steps

### Add Vector Database

Once you confirm the pipeline works, we can add:
- Pinecone/Weaviate integration for semantic search
- Embedding generation for text chunks
- Citation highlighting in PDF viewer

### Bulk Processing

To process multiple FDDs:
1. Add all PDFs to `test_pdfs/` directory
2. Run the pipeline (it processes all PDFs)
3. Uses checkpointing to resume if interrupted

## Cost Estimate

**Per FDD (200 pages):**
- Document AI: ~$1.50 (OCR)
- DeepSeek R1: ~$0.50 (analysis)
- **Total: ~$2.00 per FDD**

**For 400 FDDs: ~$800 total**

## Troubleshooting

### "Processor not found"
- Make sure you created the Document AI processor
- Copy the correct Processor ID

### "Permission denied"
- Ensure service account has these roles:
  - Document AI API User
  - Vertex AI User

### "Supabase connection failed"
- Check environment variables are set
- Verify service key has correct permissions

## Support

If you encounter issues, check:
1. Google Cloud logs: `gcloud logging read`
2. Pipeline output directory for debug files
3. Supabase logs in dashboard
