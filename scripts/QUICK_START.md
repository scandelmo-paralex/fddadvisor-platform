# Quick Start Guide - Vertex AI FDD Pipeline

## Setup (One Time)

1. **Create .env file in scripts folder:**
\`\`\`bash
cd scripts
touch .env
nano .env  # or: open .env
\`\`\`

2. **Add these variables to .env:**
\`\`\`env
GOOGLE_CLOUD_PROJECT=fddadvisor-fdd-processing
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json
SUPABASE_URL=https://utunvzekehobtyncpcza.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
\`\`\`

3. **Get Supabase Service Key:**
- Go to supabase.com → Your Project
- Settings → API → Copy `service_role` key (secret)
- Paste into .env file

## Run Test

\`\`\`bash
python vertex_complete_pipeline.py --pdf /path/to/burger-king-fdd.pdf
\`\`\`

## Check Results

1. **Terminal** - See processing output
2. **Supabase** - Check `franchises` table
3. **Browser** - Go to `/discover` page

## Next Steps

Once test works, process multiple PDFs:
\`\`\`bash
python vertex_complete_pipeline.py --folder /path/to/fdd-folder
