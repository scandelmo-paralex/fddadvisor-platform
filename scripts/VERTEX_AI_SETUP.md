# Vertex AI Setup Guide for FDD Processing

## Why Vertex AI?

With your $100K-$250K Google Cloud credits, you can use **Claude 3.5 Sonnet** (the model you already trust) at essentially **zero cost**. This is the best option for processing your 1,550 FDDs.

## Setup Steps

### 1. Enable Vertex AI in Google Cloud

\`\`\`bash
# Install Google Cloud CLI if you haven't
# Visit: https://cloud.google.com/sdk/docs/install

# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable aiplatform.googleapis.com
gcloud services enable anthropic.googleapis.com
\`\`\`

### 2. Set Up Authentication

\`\`\`bash
# Create application default credentials
gcloud auth application-default login

# Or use a service account (recommended for production)
gcloud iam service-accounts create fdd-processor \
    --display-name="FDD Processor Service Account"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:fdd-processor@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

gcloud iam service-accounts keys create key.json \
    --iam-account=fdd-processor@YOUR_PROJECT_ID.iam.gserviceaccount.com

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"
\`\`\`

### 3. Install Python Dependencies

\`\`\`bash
pip install google-cloud-aiplatform anthropic[vertex] PyPDF2 tqdm
\`\`\`

### 4. Configure the Script

Edit `process-fdds-vertex-ai.py`:

\`\`\`python
PROJECT_ID = "your-actual-project-id"  # Your GCP project ID
LOCATION = "us-central1"  # or us-east1, europe-west1, etc.
FDD_DIRECTORY = "/path/to/your/google-drive/fdds"
\`\`\`

### 5. Run the Processor

\`\`\`bash
python scripts/process-fdds-vertex-ai.py
\`\`\`

## Cost Breakdown (Covered by Your Credits!)

**Claude 3.5 Sonnet via Vertex AI:**
- Input: $3 per million tokens
- Output: $15 per million tokens

**For 1,550 FDDs:**
- Step 1 (Analysis): ~$4,650-$9,300
- Step 2 (Extraction): ~$775-$1,550
- **Total: ~$5,425-$10,875**

**Your Credits: $100,000-$250,000** ✅

You can process all 1,550 FDDs multiple times and still have credits left!

## Available Models in Vertex AI Model Garden

Your credits also give you access to:

- **Claude 3.5 Sonnet** (Recommended - best reasoning)
- **Claude 3 Opus** (Most capable, slower)
- **Gemini 1.5 Pro** (Google's model, also excellent)
- **Gemini 1.5 Flash** (Faster, cheaper)
- **Llama 3** (Open source option)

## Processing Timeline

- **1,550 FDDs** × 2 steps × ~10 seconds per step = **~8.6 hours**
- With parallel processing (5 concurrent): **~1.7 hours**

## Output Structure

\`\`\`
fdd_processing_results/
├── analyses/
│   ├── subway_2025_analysis.txt
│   ├── anytime_fitness_2025_analysis.txt
│   └── ... (1,550 files)
├── structured_data/
│   ├── subway_2025.json
│   ├── anytime_fitness_2025.json
│   └── ... (1,550 files)
└── all_franchises.json (combined)
\`\`\`

## Next Steps After Processing

1. Review sample outputs for quality
2. Run the bulk import script to populate database
3. Set up unclaimed profiles for marketplace
4. Begin vectorization for AI chat

## Troubleshooting

**Authentication Error:**
\`\`\`bash
gcloud auth application-default login
\`\`\`

**API Not Enabled:**
\`\`\`bash
gcloud services enable aiplatform.googleapis.com
\`\`\`

**Rate Limiting:**
- Vertex AI has generous rate limits
- Script includes 2-second delays between requests
- Can increase concurrency if needed

## Support

- Vertex AI Docs: https://cloud.google.com/vertex-ai/docs
- Claude on Vertex: https://docs.anthropic.com/en/api/claude-on-vertex-ai
- Your Google Cloud credits dashboard: https://console.cloud.google.com/billing
