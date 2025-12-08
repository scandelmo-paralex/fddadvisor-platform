# Complete Google Cloud Setup Guide for FDD Batch Processing

This guide will walk you through setting up Google Cloud to process 400 FDDs using Claude 3.5 Sonnet via Vertex AI.

## Prerequisites

- Google Cloud account (you already have this ✓)
- $100K-$250K in Google Cloud credits (you have this ✓)
- 400 FDD files in a local folder (Google Drive)
- Python 3.8+ installed on your computer

---

## Part 1: Google Cloud Console Setup (15 minutes)

### Step 1: Access Google Cloud Console

1. Go to https://console.cloud.google.com
2. Sign in with your Google account
3. Select your existing project (or create a new one for this)
4. **Write down your Project ID** - you'll need this later
   - Find it at the top of the page or in Project Settings

### Step 2: Enable Vertex AI API

1. In the Google Cloud Console, click the **☰ menu** (top left)
2. Go to **APIs & Services** → **Library**
3. Search for "Vertex AI API"
4. Click on it and press **Enable**
5. Wait 1-2 minutes for it to activate
6. ✓ You should see "API enabled" with a green checkmark

### Step 3: Enable Claude in Model Garden

1. In the **☰ menu**, go to **Vertex AI** → **Model Garden**
2. Search for "Claude"
3. Click on **Claude 3.5 Sonnet**
4. Click **Enable** (if not already enabled)
5. Accept any terms of service
6. ✓ Claude should now show as "Available"

### Step 4: Set Up Billing (Your Credits Will Cover This)

1. Go to **Billing** in the ☰ menu
2. Verify your project is linked to your billing account with credits
3. Check that you see your $100K-$250K credit balance
4. ✓ No credit card required if you have credits

---

## Part 2: Local Computer Setup (10 minutes)

### Step 5: Install Google Cloud CLI

**For Mac:**
\`\`\`bash
# Install using Homebrew
brew install google-cloud-sdk
\`\`\`

**For Windows:**
1. Download installer from: https://cloud.google.com/sdk/docs/install
2. Run the installer
3. Follow the prompts

**For Linux:**
\`\`\`bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
\`\`\`

**Verify installation:**
\`\`\`bash
gcloud --version
\`\`\`
You should see version information.

### Step 6: Authenticate with Google Cloud

\`\`\`bash
# Login to your Google account
gcloud auth login
\`\`\`
- A browser window will open
- Sign in with your Google account
- Grant permissions
- ✓ You should see "You are now authenticated"

\`\`\`bash
# Set your default project
gcloud config set project YOUR_PROJECT_ID
\`\`\`
Replace `YOUR_PROJECT_ID` with the Project ID from Step 1.

\`\`\`bash
# Set up application default credentials
gcloud auth application-default login
\`\`\`
- Another browser window opens
- Sign in again
- Grant permissions
- ✓ Credentials are now saved locally

### Step 7: Install Python Dependencies

\`\`\`bash
# Install required Python packages
pip install google-cloud-aiplatform anthropic[vertex] PyPDF2 tqdm python-dotenv
\`\`\`

**Verify installation:**
\`\`\`bash
python -c "import vertexai; print('Success!')"
\`\`\`
You should see "Success!"

---

## Part 3: Configure the Processing Script (5 minutes)

### Step 8: Update Script Configuration

Open `scripts/process-fdds-vertex-ai.py` and update these variables at the top:

\`\`\`python
# Your Google Cloud project ID (from Step 1)
PROJECT_ID = "your-project-id-here"

# Region where Vertex AI is available
LOCATION = "us-central1"  # or "us-east4", "europe-west4"

# Path to your FDD files
FDD_DIRECTORY = "/path/to/your/google-drive/fdds"

# Where to save results
OUTPUT_DIRECTORY = "./fdd_processing_results"
\`\`\`

### Step 9: Add Your Prompts

In the same file, find these sections and add your prompts:

**Your Analytical Prompt** (the one you use in Claude):
\`\`\`python
ANALYTICAL_PROMPT = """
[PASTE YOUR FULL ANALYTICAL PROMPT HERE]

The one you use to analyze FDDs in Claude Desktop.
"""
\`\`\`

**Extraction Prompt** (I provided this earlier):
\`\`\`python
EXTRACTION_PROMPT = """
[PASTE THE EXTRACTION PROMPT I GAVE YOU]

The one that converts analysis to JSON.
"""
\`\`\`

---

## Part 4: Test Run (30 minutes)

### Step 10: Test with 5 FDDs First

Before processing all 400, test with a small batch:

\`\`\`bash
# Navigate to your project directory
cd /path/to/fdd-advisor

# Run the script
python scripts/process-fdds-vertex-ai.py
\`\`\`

**What you'll see:**
\`\`\`
Starting FDD Processing Pipeline
================================
Project: your-project-id
Location: us-central1
FDDs to process: 5

Processing FDD 1/5: subway.pdf
  Step 1: Analyzing FDD... ✓ (12.3s)
  Step 2: Extracting data... ✓ (3.1s)
  Saved: fdd_processing_results/analyses/subway_analysis.txt
  Saved: fdd_processing_results/structured_data/subway.json

Processing FDD 2/5: anytime-fitness.pdf
...
\`\`\`

### Step 11: Review Test Results

Check the output files:

\`\`\`bash
# View the analysis text
cat fdd_processing_results/analyses/subway_analysis.txt

# View the structured JSON
cat fdd_processing_results/structured_data/subway.json
\`\`\`

**Verify:**
- ✓ Analysis text looks good and comprehensive
- ✓ JSON has all required fields
- ✓ Data is accurate

**If something looks wrong:**
- Adjust your prompts in the script
- Delete the output directory: `rm -rf fdd_processing_results`
- Run the test again

---

## Part 5: Process All 400 FDDs (8-10 hours compute time)

### Step 12: Run Full Batch Processing

Once you're happy with the test results:

\`\`\`bash
# Process all 400 FDDs
python scripts/process-fdds-vertex-ai.py
\`\`\`

**The script will:**
- Process FDDs one by one
- Save progress continuously (can resume if interrupted)
- Show estimated time remaining
- Handle errors gracefully

**You can:**
- Let it run overnight
- Close your laptop (it will pause and resume)
- Monitor progress in the terminal

**Cost tracking:**
- Check your Google Cloud billing dashboard
- You'll see charges against your credits
- Estimated: $1,400-$3,500 total

### Step 13: Monitor Progress

The script creates a checkpoint file:

\`\`\`bash
# Check how many are done
cat fdd_processing_results/processing_checkpoint.json
\`\`\`

**If interrupted:**
- Just run the script again
- It will resume from where it left off
- Already processed FDDs are skipped

---

## Part 6: Import to Database (1 hour)

### Step 14: Review Combined Output

After all 400 FDDs are processed:

\`\`\`bash
# View the combined JSON file
cat fdd_processing_results/all_franchises.json
\`\`\`

This file contains all 400 franchises in one JSON array.

### Step 15: Run Database Import

\`\`\`bash
# Import all franchises to Supabase
npm run import-franchises
# or
node scripts/bulk-import-franchises.ts
\`\`\`

**What happens:**
- Connects to your Supabase database
- Creates 400 franchise records
- Sets all as "unclaimed" (ready for claims strategy)
- Shows progress and any errors

### Step 16: Verify in Database

1. Go to your Supabase dashboard
2. Open the **Table Editor**
3. View the `franchises` table
4. ✓ You should see 400 franchise records

---

## Troubleshooting

### "Permission denied" errors
\`\`\`bash
# Re-authenticate
gcloud auth application-default login
\`\`\`

### "Quota exceeded" errors
- You're hitting rate limits
- The script will automatically retry
- Or reduce `MAX_CONCURRENT_REQUESTS` in the script

### "Model not found" errors
- Make sure Claude is enabled in Model Garden (Step 3)
- Check your `LOCATION` matches where Claude is available

### "Invalid JSON" errors
- Your extraction prompt might need adjustment
- Check the analysis text to see what Claude returned
- Refine the extraction prompt to be more specific

### Script crashes
- Check `processing_checkpoint.json` to see progress
- Run the script again - it will resume
- Check error logs in the terminal

---

## Cost Breakdown

**For 400 FDDs:**
- Analysis step: ~$2-5 per FDD = $800-$2,000
- Extraction step: ~$0.50-1 per FDD = $200-$400
- **Total: ~$1,000-$2,400**
- Covered by your $100K-$250K credits ✓

**Processing time:**
- ~60-90 seconds per FDD
- 400 FDDs = 6.7-10 hours
- Can run overnight

---

## Next Steps After Processing

1. ✓ 400 franchises in your database
2. Build the public marketplace page
3. Enable buyer discovery and connect requests
4. Implement the claims profile system
5. Launch your marketplace!

---

## Quick Reference Commands

\`\`\`bash
# Check authentication status
gcloud auth list

# Check current project
gcloud config get-value project

# View Vertex AI models available
gcloud ai models list --region=us-central1

# Check processing progress
cat fdd_processing_results/processing_checkpoint.json

# Resume processing after interruption
python scripts/process-fdds-vertex-ai.py

# Import to database
node scripts/bulk-import-franchises.ts
\`\`\`

---

## Need Help?

- **Google Cloud docs**: https://cloud.google.com/vertex-ai/docs
- **Vertex AI Model Garden**: https://cloud.google.com/vertex-ai/docs/start/explore-models
- **Check your credits**: Google Cloud Console → Billing

You've got this! 🚀
