# Testing the Vertex AI Pipeline

## Quick Start Test

### 1. Prepare Test PDF

Choose ONE FDD PDF to test with (preferably one with Item 19 data):
- Burger King
- 7-Eleven  
- McDonald's
- Or any other FDD you have

\`\`\`bash
mkdir test_pdfs
cp "/path/to/BurgerKing_FDD.pdf" test_pdfs/
\`\`\`

### 2. Run Pipeline

\`\`\`bash
python scripts/vertex_complete_pipeline.py
\`\`\`

### 3. Expected Output

You should see:

\`\`\`
======================================================================
VERTEX AI COMPLETE FDD PIPELINE
======================================================================

Found 1 PDF(s) to process

======================================================================
PROCESSING: BurgerKing_FDD
======================================================================

Extracting text from PDF using Vertex AI Vision API...
✓ Extracted 245,832 characters from 187 pages
✓ Found 22 Item headers

Extracting Items 1-22...
✓ Extracted Items 1-22 (198,456 characters)

Detecting financial exhibits referenced in Item 19...
✓ Found 2 financial exhibits referenced: {'H', 'I'}
  ✓ Extracted Exhibit H
  ✓ Extracted Exhibit I

Analyzing FDD with DeepSeek...
  Step 1: Generating narrative analysis...
  Step 2: Extracting structured JSON...
✓ Successfully extracted structured data

Storing data in Supabase...
✓ Successfully stored in Supabase

Preparing text chunks for vector database...
✓ Created 47 text chunks for vector database

======================================================================
✓ COMPLETED: BurgerKing_FDD
======================================================================

Results saved to: pipeline_output/BurgerKing_FDD
  - full_text.txt: Complete PDF text
  - items_1_to_22.txt: Core FDD items
  - financial_exhibits.json: Extracted exhibits
  - analysis.json: Structured analysis
  - vector_chunks.json: Ready for vector DB
  - Supabase: Data stored in database
\`\`\`

### 4. Verify in Supabase

Run this SQL query in Supabase SQL Editor:

\`\`\`sql
SELECT 
  name,
  franchise_score,
  has_item19,
  total_units,
  array_length(opportunities::json, 1) as opportunity_count,
  array_length(concerns::json, 1) as concern_count
FROM franchises
WHERE name LIKE '%Burger King%'
ORDER BY created_at DESC
LIMIT 1;
\`\`\`

Expected result:
- name: "Burger King"
- franchise_score: ~312
- has_item19: true
- total_units: 7167
- opportunity_count: 3
- concern_count: 3

### 5. View in FDD Viewer

1. Go to your app: `/discover`
2. You should now see Burger King (or your test franchise)
3. Click to open FDD Viewer
4. Verify:
   - ✓ FranchiseScore displays
   - ✓ Opportunities show with citations
   - ✓ Concerns show with citations
   - ✓ Investment data displays
   - ✓ Revenue data shows (if Item 19 available)

## What to Check

### ✅ Success Indicators

- [ ] PDF text extracted successfully
- [ ] Items 1-22 identified
- [ ] Financial exhibits detected (if referenced)
- [ ] DeepSeek analysis completed
- [ ] Data stored in Supabase
- [ ] Franchise appears in /discover page
- [ ] FDD Viewer displays all data correctly

### ❌ Common Issues

**Issue: "Processor not found"**
- Solution: Create Document AI processor first

**Issue: "No financial exhibits found"**
- This is OK! Not all FDDs reference exhibits in Item 19
- The pipeline will still analyze Items 1-22

**Issue: "Supabase storage failed"**
- Check environment variables
- Verify service key permissions

## Next Steps After Successful Test

1. **Add More PDFs**: Copy more FDDs to `test_pdfs/`
2. **Bulk Process**: Run pipeline again (processes all PDFs)
3. **Vector Database**: Add Pinecone/Weaviate integration
4. **PDF Viewer**: Upload PDF pages to Blob storage
5. **Citations**: Implement clickable citations

## Questions?

If the test works, you're ready to:
- Process all 400 FDDs
- Add vector database for semantic search
- Implement PDF viewer with citations
- Build AI chat with RAG
