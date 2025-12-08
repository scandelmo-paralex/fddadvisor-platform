# Two-Step FDD Processing Guide

## Overview

This script processes 1,550 FDDs through a two-step pipeline:
1. **Step 1**: Generate narrative analysis (like your Claude prompt)
2. **Step 2**: Extract structured JSON data for database import

## Prerequisites

### 1. Install Dependencies

\`\`\`bash
pip install openai PyPDF2 pdf2image tqdm
\`\`\`

### 2. Set OpenAI API Key

\`\`\`bash
export OPENAI_API_KEY="your-api-key-here"
\`\`\`

### 3. Organize Your FDDs

Place all 1,550 PDF files in a folder (e.g., from Google Drive):

\`\`\`
/path/to/fdds/
  ├── subway.pdf
  ├── anytime-fitness.pdf
  ├── dunkin.pdf
  └── ... (1,547 more)
\`\`\`

## Configuration

Edit the script to point to your FDD folder:

\`\`\`python
FDD_DIRECTORY = "/path/to/your/google-drive/fdds"
\`\`\`

## Running the Script

\`\`\`bash
cd scripts
python process-fdds-two-step.py
\`\`\`

## What It Does

### Step 1: Analysis Generation
- Reads each PDF
- Extracts text from the FDD
- Sends to GPT-4 with your analytical prompt
- Saves narrative analysis to `fdd_processed/analyses/{franchise}.txt`

### Step 2: Data Extraction
- Takes the narrative analysis
- Sends to GPT-4 with extraction prompt
- Extracts structured JSON data
- Saves to `fdd_processed/structured/{franchise}.json`

## Output Structure

\`\`\`
fdd_processed/
├── analyses/
│   ├── subway.txt          # Narrative analysis
│   ├── anytime-fitness.txt
│   └── ...
├── structured/
│   ├── subway.json         # Structured data
│   ├── anytime-fitness.json
│   └── ...
└── all_franchises.json     # Combined JSON for all franchises
\`\`\`

## Structured Data Format

Each JSON file contains:

\`\`\`json
{
  "franchise_name": "Subway",
  "brand_description": "...",
  "industry": "Food & Beverage",
  "initial_investment_low": 229000,
  "initial_investment_high": 522000,
  "royalty_fee": "8%",
  "marketing_fee": "4.5%",
  "item19_available": true,
  "item19_summary": "...",
  "total_units": 20000,
  "key_strengths": ["...", "...", "..."],
  "key_concerns": ["...", "..."],
  ...
}
\`\`\`

## Features

- **Checkpoint/Resume**: If interrupted, run again to resume
- **Progress Tracking**: Shows progress bar and status
- **Error Handling**: Failed FDDs are logged, processing continues
- **Rate Limiting**: 2-second delay between requests (adjustable)

## Cost Estimates

- **Step 1 (Analysis)**: ~$0.50-$1.50 per FDD
- **Step 2 (Extraction)**: ~$0.10-$0.30 per FDD
- **Total per FDD**: ~$0.60-$1.80
- **Total for 1,550**: ~$930-$2,790

## Processing Time

- ~10-15 seconds per FDD (both steps)
- Total time: ~4-6 hours for all 1,550

## Next Steps

After processing, use the bulk import script:

\`\`\`bash
npm run import-franchises
\`\`\`

This will import all structured data into your Supabase database.

## Customization

### Adjust the Analytical Prompt

Edit `ANALYTICAL_PROMPT` in the script to match your exact Claude prompt.

### Adjust the Extraction Prompt

Edit `EXTRACTION_PROMPT` to extract different fields or change the JSON structure.

### Change Models

\`\`\`python
model="gpt-4-turbo-preview"  # Faster, cheaper
model="gpt-4"                # More accurate
\`\`\`

## Troubleshooting

**"No module named 'pdf2image'"**
- Install: `pip install pdf2image`
- May need poppler: `brew install poppler` (Mac) or `apt-get install poppler-utils` (Linux)

**"Rate limit exceeded"**
- Increase `time.sleep(2)` to `time.sleep(5)`
- Or process in smaller batches

**"Token limit exceeded"**
- Reduce `max_chars = 100000` to a smaller value
- Or process only first 30 pages of FDD
