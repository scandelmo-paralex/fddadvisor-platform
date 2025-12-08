# FDD Batch Processing Guide

## Setup

1. **Install dependencies:**
\`\`\`bash
pip install openai tqdm python-dotenv
\`\`\`

2. **Set environment variable:**
\`\`\`bash
export OPENAI_API_KEY="your-api-key-here"
\`\`\`

3. **Organize your FDDs:**
\`\`\`
fdds/
  input/
    franchise-1/
      page-001.png
      page-002.png
      ...
    franchise-2/
      page-001.png
      ...
  output/
    (results will be saved here)
\`\`\`

## Running the Script

**Process all FDDs:**
\`\`\`bash
python scripts/batch-process-fdds.py
\`\`\`

**Resume after interruption:**
The script automatically saves progress in `fdds/checkpoint.json`. If interrupted, just run again and it will skip already-processed FDDs.

## Output

**Individual results:**
- `fdds/output/franchise-1.json`
- `fdds/output/franchise-2.json`
- etc.

**Combined results:**
- `fdds/output/all_franchises.json` - All franchises in one file

**Error report:**
- `fdds/output/errors.json` - Any FDDs that failed processing

## Cost Estimation

- **GPT-4 Vision:** ~$0.50-$2 per FDD
- **Total for 1,550 FDDs:** $775-$3,100
- **Processing time:** ~2-4 hours (with rate limiting)

## Customization

**Adjust your prompt:**
Edit the `ANALYTICAL_PROMPT` variable in the script to match your exact extraction needs.

**Change rate limits:**
Adjust `DELAY_BETWEEN_REQUESTS` to control API call frequency.

**Process specific FDDs:**
Modify `get_fdd_files()` to filter specific franchises.

## Next Steps

After processing, use the bulk import script to load results into your database:
\`\`\`bash
node scripts/bulk-import-franchises.js fdds/output/all_franchises.json
