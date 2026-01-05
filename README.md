# FDDHub & FDDAdvisor Platform

[![Production - FDDHub](https://img.shields.io/badge/Production-app.fddhub.com-blue?style=for-the-badge)](https://app.fddhub.com)
[![Production - FDDAdvisor](https://img.shields.io/badge/Production-fddadvisor.com-green?style=for-the-badge)](https://fddadvisor.com)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

**AI-Powered Franchise Intelligence Platform**

A dual-product platform transforming how franchise disclosure documents (FDDs) are distributed, analyzed, and understood.

---

## 🎯 Platform Overview

### Two Products, One Ecosystem

| Product | URL | Purpose |
|---------|-----|---------|
| **FDDAdvisor** | fddadvisor.com | Free public research platform with FranchiseScore™ ratings |
| **FDDHub** | app.fddhub.com | B2B SaaS for franchisors - lead management & FDD distribution |

### Value Proposition

**For Franchise Buyers (FDDAdvisor):**
- Independent, objective FranchiseScore™ ratings (0-600 points)
- AI-powered analysis of all 23 FDD Items
- Side-by-side franchise comparisons
- Semantic search and AI chat for FDD exploration
- 100% free, no lead capture, complete independence

**For Franchisors (FDDHub):**
- Compliant FDD delivery with 14-day tracking
- Lead intelligence and engagement analytics
- Custom pipeline stages for sales management
- Team member management with role-based access
- White-label branded FDD viewer
- DocuSeal integration for Item 23 receipt signing

---

## ✨ Key Features

### FranchiseScore™ 2.1 Methodology

Objective 600-point scoring system across 4 dimensions:

| Dimension | Points | Focus |
|-----------|--------|-------|
| **Financial Transparency** | 150 | Item 19 quality, investment clarity, fee structure |
| **System Strength** | 150 | Growth patterns, franchisor longevity, clean record |
| **Franchisee Support** | 150 | Training quality, operational support, territory protection |
| **Business Foundation** | 150 | Management experience, performance indicators |

**Key Features:**
- 3-year recency filter for litigation (only recent cases penalized)
- Neutral language requirements (no subjective descriptors)
- FDD-only analysis (no external data)
- Transparent calculations with formulas shown

📖 **[Full Methodology Documentation](./FRANCHISESCORE_METHODOLOGY_2_1.md)**

### For Buyers

- **AI Discovery Assistant**: Personalized franchise recommendations
- **FDD Viewer**: Interactive PDF viewer with semantic search
- **AI Chat**: Ask questions and get instant answers with Item citations
- **Comparison Tools**: Side-by-side franchise evaluation
- **Notes System**: Save personal notes while reviewing FDDs
- **Progress Tracking**: Track your franchise evaluation journey

### For Franchisors

- **Lead Management Dashboard**: Track all prospects in one place
- **Custom Pipeline Stages**: Configure your sales process (8 default stages)
- **Lead Intelligence**: See engagement metrics, time spent, questions asked
- **Team Management**: Add recruiters with role-based permissions
- **Invitation System**: Send branded FDD invitations via email
- **Compliance Tracking**: 14-day waiting period enforcement
- **DocuSeal Integration**: Electronic Item 23 receipt signing
- **White-Label Branding**: Custom colors, logos, and messaging

### AI Capabilities

- **FDD Analysis Pipeline**: Automated extraction and scoring of all 23 Items
- **Semantic Search**: Vector-based search across FDD content
- **AI Chat Assistant**: Context-aware Q&A with source citations
- **Zero Hallucinations**: Strict RAG architecture ensures factual responses
- **Item 19 Guardrails**: Prevents financial performance representations

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19** with Server Components
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **shadcn/ui** components
- **react-pdf** for document viewing
- **@dnd-kit** for drag-and-drop (pipeline stages)

### Backend
- **Next.js API Routes** (Server Actions & Route Handlers)
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Row Level Security** (RLS) for multi-tenant isolation
- **pgvector** extension for semantic search

### AI & ML
- **Google Gemini 2.5 Flash** (FDD analysis)
- **Claude 4.5 Sonnet** (FranchiseScore synthesis)
- **text-embedding-004** (768-dimension vectors)
- **PDFPlumber** (text extraction)

### Infrastructure
- **Vercel** (hosting, edge functions, analytics)
- **Supabase** (database, auth, storage)
- **Sentry** (error monitoring, performance)
- **Resend** (transactional email)
- **DocuSeal** (electronic signatures)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Google Cloud Platform account with Vertex AI enabled
- Vercel account (for deployment)

### Environment Variables

Create a `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google Cloud Platform
GCP_PROJECT_ID=your_gcp_project_id
GOOGLE_API_KEY=your_google_api_key
GOOGLE_APPLICATION_CREDENTIALS_JSON=your_service_account_json

# AI Models
ANTHROPIC_API_KEY=your_anthropic_api_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key

# DocuSeal
DOCUSEAL_API_KEY=your_docuseal_api_key

# Sentry
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/fddhub.git
cd fddhub

# Install dependencies
pnpm install

# Run database migrations (see scripts/ folder)
# Start with 00-complete-database-setup.sql

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the application.

---

## 📁 Project Structure

```
fddhub/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── fdd-chat/            # AI chat endpoint
│   │   ├── hub/                 # FDDHub API routes
│   │   ├── leads/               # Lead management
│   │   ├── pipeline-stages/     # Custom stages
│   │   └── team/                # Team management
│   ├── hub/                     # FDDHub pages
│   │   ├── company-settings/    # Franchisor settings
│   │   ├── fdd/[franchiseId]/   # FDD viewer
│   │   ├── leads/               # Lead management
│   │   └── my-fdds/             # Buyer dashboard
│   ├── fdd/[slug]/              # Public FDD viewer
│   ├── legal/                   # Terms & Privacy
│   └── login/signup/            # Authentication
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── fdd-viewer.tsx           # PDF viewer with AI chat
│   ├── franchise-score.tsx      # Score display
│   ├── pipeline-view.tsx        # Kanban pipeline
│   ├── pipeline-stage-manager/  # Stage configuration
│   └── team-management.tsx      # Team UI
├── lib/                         # Utility functions
│   ├── supabase/               # Supabase clients
│   └── types/                  # TypeScript definitions
├── scripts/                     # Database & processing
│   ├── *.sql                   # Migration scripts
│   ├── vertex_item_by_item_pipeline.py
│   ├── upload_to_supabase.py
│   └── enhanced_chunking_for_semantic_search.py
├── docs/                        # Documentation
│   ├── DATABASE-SCHEMA.md
│   ├── FRANCHISESCORE_METHODOLOGY_2.0.md
│   └── ...
└── public/                      # Static assets
```

---

## 🤖 Adding New Franchises

### Automated Pipeline

The FDD processing pipeline extracts, analyzes, and scores FDDs automatically:

```bash
# Step 1: Run the analysis pipeline
cd scripts
python3 vertex_item_by_item_pipeline.py \
  --pdf "path/to/Franchise_FDD_2025.pdf" \
  --output "../pipeline_output/Franchise Name FDD (2025)/"

# Step 2: Upload to Supabase
python3 upload_to_supabase.py \
  --json "pipeline_output/Franchise Name FDD (2025)/analysis.json"

# Step 3: Generate embeddings (use FDD ID from step 2)
python3 enhanced_chunking_for_semantic_search.py \
  "pipeline_output/Franchise Name FDD (2025)" \
  "FDD_UUID_HERE"
```

### Processing Time
- **Per FDD**: 15-20 minutes
- **Batch (400 FDDs)**: ~2 hours with cloud processing

📖 **[Complete FDD Processing Guide](./FDD_PROCESSING_GUIDE.md)**

---

## 🔐 Authentication & Roles

### User Roles

| Role | Access |
|------|--------|
| **Buyer** | FDD viewer, comparisons, AI chat, notes |
| **Franchisor** | Dashboard, leads, team, settings |
| **Admin** | Full access including processing pipeline |
| **Lender** | Pre-approval tracking (future) |

### Team Member Roles (Franchisors)

| Role | Permissions |
|------|-------------|
| **Admin** | Full access, same as owner |
| **Recruiter** | View assigned leads only |
| **Viewer** | Read-only access |

---

## 📊 Database Schema

Key tables:

| Table | Purpose |
|-------|---------|
| `franchises` | Franchise brands with FranchiseScore data |
| `fdds` | FDD documents and processing status |
| `fdd_chunks` | Vector embeddings for semantic search |
| `lead_invitations` | Franchisor-sent invitations |
| `lead_fdd_access` | Buyer FDD access permissions |
| `fdd_engagements` | Engagement analytics |
| `pipeline_stages` | Custom sales stages |
| `franchisor_team_members` | Team management |

📖 **[Full Database Schema](./docs/DATABASE-SCHEMA.md)**

---

## 🚢 Deployment

### Production URLs

| Environment | URL | Purpose |
|-------------|-----|---------|
| Production (Hub) | app.fddhub.com | Franchisor SaaS |
| Production (Advisor) | fddadvisor.com | Public research |
| Marketing | fddhub.com | Marketing site |

### Vercel Deployment

The project auto-deploys to Vercel on push to `main`:

- **Preview**: Feature branches get preview URLs
- **Production**: `main` branch deploys to production
- **Environment Variables**: Configured in Vercel dashboard

---

## 📈 Monitoring

### Sentry Integration

- **Error Tracking**: All errors captured with context
- **Performance**: Core Web Vitals monitoring
- **Alerts**: Configured for critical errors

### Vercel Analytics

- **Speed Insights**: Performance metrics
- **Web Analytics**: Usage patterns
- **Real User Monitoring**: Actual user experience

---

## 📝 Legal Compliance

FDDHub is designed for FTC Franchise Rule compliance:

- ✅ 14-day waiting period enforcement
- ✅ Unmodified FDD delivery
- ✅ Timestamped consent tracking
- ✅ Electronic receipt signing (DocuSeal)
- ✅ Independent FranchiseScore (no franchisor influence)
- ✅ AI guardrails against financial performance representations

📖 **[Compliance Memo](./FDDHUB_Compliance_Memo_Final.docx)**

---

## 🗺️ Roadmap

### Completed ✅
- [x] FranchiseScore™ 2.1 methodology
- [x] FDD processing pipeline
- [x] AI chat with semantic search
- [x] Lead invitation system
- [x] Custom pipeline stages
- [x] Team member management
- [x] DocuSeal integration
- [x] White-label branding
- [x] Sentry error monitoring

### In Progress 🚧
- [ ] Cloud FDD processing (Google Cloud Functions)
- [ ] Real-time engagement data connection
- [ ] Item 19 AI guardrails
- [ ] Mobile optimization

### Planned 📋
- [ ] 400 franchises for FDDAdvisor launch
- [ ] Insights module (competitive intelligence)
- [ ] CRM integrations (HubSpot, Salesforce)
- [ ] Bulk lead import
- [ ] Advanced analytics dashboard

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Proprietary software. All rights reserved.

---

## 🔗 Links

- **FDDHub Production**: [app.fddhub.com](https://app.fddhub.com)
- **FDDAdvisor**: [fddadvisor.com](https://fddadvisor.com)
- **Documentation**: [docs/](./docs/)
- **FranchiseScore Methodology**: [FRANCHISESCORE_METHODOLOGY_2_1.md](./FRANCHISESCORE_METHODOLOGY_2_1.md)

---

## 📧 Support

For questions or support:
- Technical issues: Open a GitHub issue
- Business inquiries: Contact Paralex, Inc.

---

*Built with ❤️ by Paralex, Inc.*
*Last Updated: January 5, 2026*
