# FDDAdvisor Platform

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/scandelmo-3095s-projects/v0-fdda-dvisor-platform-build)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/njaNk1lZpTV)

**AI-Powered Franchise Disclosure Document (FDD) Analysis Platform**

FDDAdvisor is a comprehensive platform that helps prospective franchisees make informed decisions by analyzing Franchise Disclosure Documents using AI and providing objective FranchiseScore™ ratings.

---

## 🎯 Overview

FDDAdvisor transforms the complex process of evaluating franchise opportunities by:

- **Automated FDD Analysis**: AI-powered extraction and analysis of all 23 FDD items
- **FranchiseScore™ 2.0**: Objective 600-point scoring system across 4 critical dimensions
- **Interactive PDF Viewer**: Semantic search and AI chat for exploring FDD documents
- **Buyer Dashboard**: Track and compare multiple franchise opportunities
- **Franchisor Portal**: White-label platform for franchisors to showcase their FDDs

---

## ✨ Key Features

### For Franchise Buyers
- **FDD Analysis**: Comprehensive breakdown of all 23 FDD items with AI-generated insights
- **FranchiseScore™**: Objective scoring (0-600 points) across Financial Transparency, System Strength, Franchisee Support, and Business Foundation
- **Semantic Search**: Ask questions and get instant answers from FDD documents
- **AI Chat Assistant**: Interactive Q&A about franchise opportunities
- **Comparison Tools**: Side-by-side franchise comparison
- **Progress Tracking**: Monitor your franchise evaluation journey

### For Franchisors
- **White-Label Portal**: Branded platform for sharing FDDs with prospects
- **Lead Management**: Track buyer engagement and interest
- **Analytics Dashboard**: Insights into buyer behavior and questions
- **Secure Document Sharing**: Password-protected FDD access

### For Administrators
- **FDD Processing Pipeline**: Upload and process new FDDs
- **Item Mapping**: Manual review and correction of AI extractions
- **User Management**: Manage buyers, franchisors, and access
- **System Monitoring**: Track processing status and errors

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19.2** with Server Components
- **TypeScript**
- **Tailwind CSS v4**
- **shadcn/ui** components
- **React PDF** for document viewing

### Backend
- **Next.js API Routes** (Server Actions & Route Handlers)
- **Supabase** (PostgreSQL database + Auth)
- **Vercel Blob** (File storage)
- **Google Cloud Vertex AI** (Document AI & Gemini)

### AI & ML
- **Vercel AI SDK v5** (AI Gateway)
- **Google Gemini 2.0 Flash** (FDD analysis)
- **Document AI** (PDF text extraction)
- **Vertex AI Embeddings** (Semantic search)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account and project
- Google Cloud Platform account with Vertex AI enabled
- Vercel account (for deployment)

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`bash
# Supabase
SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Vercel Blob
BLOB_READ_WRITE_TOKEN=your_blob_token

# Google Cloud Platform
GCP_PROJECT_ID=your_gcp_project_id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS_JSON=your_service_account_json
GOOGLE_API_KEY=your_google_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/your-username/fddadvisor.git
cd fddadvisor

# Install dependencies
npm install

# Run database migrations (see Database Setup below)

# Start development server
npm run dev
\`\`\`

Visit `http://localhost:3000` to see the application.

---

## 🗄️ Database Setup

### Supabase Schema

The platform uses the following main tables:

- **`franchises`**: Core franchise information and metadata
- **`franchise_scores`**: FranchiseScore™ data with breakdown
- **`fdd_items`**: Extracted content from all 23 FDD items
- **`fdd_pages`**: Individual PDF pages with embeddings for semantic search
- **`users`**: User accounts (managed by Supabase Auth)
- **`buyer_progress`**: Tracks buyer evaluation progress
- **`franchisor_profiles`**: Franchisor account information
- **`white_label_settings`**: Custom branding configurations

### Running Migrations

SQL migration scripts are located in the `scripts/` folder. Run them in order:

\`\`\`bash
# Example: Create tables
python3 scripts/create_tables.sql

# Example: Seed initial data
python3 scripts/seed_data.sql
\`\`\`

---

## 📊 FranchiseScore™ Methodology

FDDAdvisor uses the **FranchiseScore™ 2.0** methodology to provide objective franchise ratings.

### Scoring Structure (600 points total)

| Dimension | Points | Focus |
|-----------|--------|-------|
| **Financial Transparency** | 150 | Item 19 quality, investment clarity, fee transparency |
| **System Strength** | 150 | Growth patterns, franchisor longevity, clean record |
| **Franchisee Support** | 150 | Training quality, operational support, territory protection |
| **Business Foundation** | 150 | Management experience, performance indicators, satisfaction signals |

### Key Principles

1. **FDD-Only Analysis** - All scores derived exclusively from Items 1-23
2. **Neutral Language** - Factual, quantitative descriptions without subjective characterizations
3. **Expert-Validated** - Based on FTC, SBA, and industry analyst guidance
4. **Absolute Rubric** - No competitive benchmarking; each franchise scored independently
5. **Transparent Calculations** - All scoring formulas clearly documented

📖 **[Read the full methodology](docs/FRANCHISESCORE_METHODOLOGY_2.0.md)**

---

## 🤖 Adding New Franchises

### Process Overview

1. **Run the Pipeline Locally** - Process FDD PDF with AI extraction
2. **Upload analysis.json** - Import franchise data to Supabase
3. **Process Embeddings** - Generate semantic search embeddings
4. **Upload PDF to Supabase Storage** - Store the full PDF for rendering
5. **Map Items and Exhibits** - Manually map items and exhibits to page numbers
6. **Upload logo via admin interface or Vercel Blob** - Add franchise branding

### Quick Start

Use the automated helper script:

\`\`\`bash
python3 scripts/add_new_franchise.py \
  --pipeline-dir pipeline_output/Your-Franchise-Name \
  --logo path/to/logo.png
\`\`\`

### Manual Process

\`\`\`bash
# Step 1: Run the pipeline
python3 scripts/vertex_item_by_item_pipeline.py path/to/fdd.pdf

# Step 2: Upload to Supabase
python3 scripts/upload_to_supabase.py \
  --json pipeline_output/Your-Franchise-Name/analysis.json

# Step 3: Get the FDD ID from Supabase, then process embeddings
python3 scripts/enhanced_chunking_for_semantic_search.py \
  pipeline_output/Your-Franchise-Name \
  <fdd_id>

# Step 4: Upload PDF to Supabase Storage
# Upload the full PDF to your Supabase storage bucket (e.g., 'fdd-pdfs' bucket)
# Store the PDF URL in the franchises table (fdd_pdf_url field)
# The PDF Viewer uses react-pdf and pdfjs-dist to:
#   1. Fetch the PDF from the Supabase storage URL
#   2. Render the PDF pages visually
#   3. Automatically extract and render an invisible text layer from the PDF's embedded text
# 
# The invisible text layer enables:
#   - Text selection and copying
#   - Semantic search in AI chat
#   - Page navigation (keyboard shortcuts, page jumping)
#   - Citation clicking (jump to specific pages from AI responses)
# 
# No separate page images or text extraction needed - react-pdf handles everything!

# Step 5: Map Items and Exhibits (Admin Tool)
# Navigate to /admin/fdd/[fdd_id]/item-mapping in your browser
# Use the admin interface to manually map Items 1-23 to their page numbers
# Also map Exhibits (A, B, C, etc.) to their starting page numbers
# Mappings are stored in the fdd_item_page_mappings table
# This enables:
#   - "Jump to Items" dropdown in PDF viewer
#   - "Jump to Exhibits" dropdown in PDF viewer
#   - Quick Links navigation
#   - Automatic item tracking as users scroll through the PDF

# Step 6: Upload Logo
# Option 1: Use admin interface at /admin/fdd-processing
# Option 2: Upload directly to Vercel Blob and update franchises.logo_url
\`\`\`

---

## 📁 Project Structure

\`\`\`
fddadvisor/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication routes
│   ├── admin/                    # Admin dashboard
│   ├── api/                      # API routes
│   ├── buyer/                    # Buyer dashboard
│   ├── fdd/[slug]/              # FDD viewer pages
│   ├── franchisor/              # Franchisor portal
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── fdd-viewer.tsx           # PDF viewer with AI chat
│   ├── franchise-score.tsx      # Score display
│   └── ...
├── lib/                         # Utility functions
│   ├── supabase/               # Supabase clients
│   ├── api-client.ts           # API utilities
│   └── utils.ts                # Helper functions
├── scripts/                     # Python processing scripts
│   ├── vertex_item_by_item_pipeline.py
│   ├── upload_to_supabase.py
│   ├── enhanced_chunking_for_semantic_search.py
│   └── add_new_franchise.py
├── docs/                        # Documentation
│   ├── FRANCHISESCORE_METHODOLOGY_2.0.md
│   └── adding-new-franchise.md
└── public/                      # Static assets
\`\`\`

---

## 🔐 Authentication

FDDAdvisor uses **Supabase Auth** with email/password authentication.

### User Roles

- **Buyer**: Access to FDD viewer, comparison tools, and progress tracking
- **Franchisor**: Access to white-label portal and lead management
- **Admin**: Full access to processing pipeline and user management

### Protected Routes

- `/buyer/*` - Requires buyer authentication
- `/franchisor/*` - Requires franchisor authentication
- `/admin/*` - Requires admin authentication

---

## 🤖 AI Features

### FDD Analysis Pipeline

The AI pipeline processes FDDs through multiple stages:

1. **PDF Extraction**: Google Document AI extracts text with layout preservation
2. **Item Identification**: Gemini 2.0 Flash identifies and extracts all 23 FDD items
3. **Structured Analysis**: AI generates structured JSON for each item
4. **FranchiseScore Calculation**: Automated scoring based on methodology
5. **Embedding Generation**: Vertex AI creates embeddings for semantic search

### AI Chat Assistant

The FDD viewer includes an AI chat assistant that:

- Answers questions about the specific FDD
- Provides context-aware responses using semantic search
- Cites specific pages and sections
- Maintains conversation history

---

## 🚢 Deployment

### Vercel Deployment

The project is configured for one-click deployment to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/fddadvisor)

### Environment Variables

Set all required environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Database

Supabase provides a hosted PostgreSQL database. No additional database setup required.

---

## 📝 Development

### Running Tests

\`\`\`bash
npm run test
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

### Type Checking

\`\`\`bash
npm run type-check
\`\`\`

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🔗 Links

- **Live Platform**: [https://vercel.com/scandelmo-3095s-projects/v0-fdda-dvisor-platform-build](https://vercel.com/scandelmo-3095s-projects/v0-fdda-dvisor-platform-build)
- **v0 Project**: [https://v0.app/chat/projects/njaNk1lZpTV](https://v0.app/chat/projects/njaNk1lZpTV)
- **FranchiseScore Methodology**: [docs/FRANCHISESCORE_METHODOLOGY_2.0.md](docs/FRANCHISESCORE_METHODOLOGY_2.0.md)

---

## 📧 Support

For questions or support, please contact the development team or open an issue in the repository.

---

**Built with ❤️ using [v0.app](https://v0.app)**
