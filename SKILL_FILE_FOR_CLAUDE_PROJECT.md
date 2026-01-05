# FDDAdvisor & FDDHub Development Skill

> **Version:** 2.1  
> **Last Updated:** January 5, 2026  
> **Platform Status:** Production

---

## Overview

This skill provides comprehensive guidance for developing and maintaining the FDDAdvisor and FDDHub franchise intelligence platforms.

### Platform Architecture

| Product | Domain | Purpose |
|---------|--------|---------|
| **FDDAdvisor** | fddadvisor.com | Free public research platform with FranchiseScore™ ratings |
| **FDDHub** | app.fddhub.com | B2B SaaS for franchisors - lead management & FDD distribution |

### Business Context

- **Company:** Paralex, Inc.
- **Target Market:** Franchise buyers and franchisors
- **Revenue Model:** FDDHub SaaS subscriptions ($299-$1,497/month) + 5-10% commissions
- **Key Value Prop:** "The Carfax for Franchises" - independent, objective FDD analysis

---

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with Server Components
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **shadcn/ui** components
- **react-pdf** for document viewing
- **@dnd-kit** for drag-and-drop

### Backend
- **Next.js API Routes**
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Row Level Security (RLS)** for multi-tenant isolation
- **pgvector** extension for semantic search

### AI/ML
- **Google Gemini 2.5 Flash** - FDD item analysis
- **Claude 4.5 Sonnet** - FranchiseScore synthesis
- **text-embedding-004** - 768-dimension vectors
- **PDFPlumber** - text extraction

### Infrastructure
- **Vercel** - hosting, edge functions, analytics
- **Sentry** - error monitoring
- **Resend** - transactional email
- **DocuSeal** - electronic signatures

---

## Key Features

### FranchiseScore™ 2.1 Methodology

600-point scoring system across 4 dimensions:

| Dimension | Points | Key Metrics |
|-----------|--------|-------------|
| Financial Transparency | 150 | Item 19 quality, investment clarity, fees |
| System Strength | 150 | Growth pattern, longevity, clean record |
| Franchisee Support | 150 | Training, operations, territory |
| Business Foundation | 150 | Management, performance, satisfaction |

**Critical Rules:**
- 3-year recency filter for litigation (only 2022-2025 cases scored)
- Territory Protection: most franchises score 24/42 (e-commerce exceptions)
- Neutral language required (no "impressive", "robust", "strong")
- All claims must cite specific FDD Items

### For Franchisors (FDDHub)

- **Lead Invitation System** - Magic link authentication
- **Custom Pipeline Stages** - 8 defaults, fully customizable
- **Team Member Management** - Admin/Recruiter/Viewer roles
- **Lead Intelligence** - Engagement analytics, time spent, questions
- **White-Label Branding** - Custom colors, logos, messaging
- **DocuSeal Integration** - Item 23 receipt signing
- **Compliance Tracking** - 14-day waiting period enforcement

### For Buyers (FDDAdvisor)

- **FDD Viewer** - Interactive PDF with semantic search
- **AI Chat** - Context-aware Q&A with source citations
- **Comparison Tools** - Side-by-side franchise evaluation
- **Notes System** - Personal notes while reviewing
- **Progress Tracking** - Franchise evaluation journey

---

## Database Schema (Key Tables)

### Core Tables
```
franchises          - Brands with FranchiseScore data
fdds                - FDD documents and processing status
fdd_chunks          - Vector embeddings for semantic search
buyer_profiles      - Buyer demographics and qualifications
franchisor_profiles - Franchisor company information
```

### Lead Management
```
lead_invitations    - Franchisor-sent invitations with pipeline tracking
lead_fdd_access     - Buyer FDD access permissions
fdd_engagements     - Engagement analytics
```

### Team & Pipeline
```
franchisor_team_members - Team roles and permissions
pipeline_stages         - Custom sales pipeline stages
lead_stage_history      - Audit trail for stage changes
```

### Supporting Tables
```
white_label_settings     - Per-franchise branding
fdd_item_page_mappings   - PDF navigation
user_notes               - Buyer notes on FDDs
fdd_franchisescore_consents - Consent tracking
```

---

## API Patterns

### Route Structure
```
/api/hub/*           - FDDHub endpoints (franchisor context)
/api/leads/*         - Lead management
/api/pipeline-stages/* - Custom stages
/api/team/*          - Team member management
/api/fdd-chat        - AI chat endpoint
/api/fdd/[id]/search - Semantic search
```

### Authentication
- Supabase Auth for all users
- Magic links for lead invitations
- RLS policies for multi-tenant isolation
- Service role key for admin operations

### Common Patterns
```typescript
// Server Component data fetching
import { createServerClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createServerClient()
  const { data } = await supabase.from('table').select('*')
}

// API Route with auth
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
}
```

---

## FDD Processing Pipeline

### Local Processing (15-20 min/FDD)
```bash
# 1. Run analysis
python3 vertex_item_by_item_pipeline.py --pdf "FDD.pdf" --output "output/"

# 2. Upload to Supabase
python3 upload_to_supabase.py --json "output/analysis.json"

# 3. Generate embeddings
python3 enhanced_chunking_for_semantic_search.py "output/" "FDD_UUID"
```

### Cloud Processing (400 FDDs in ~2 hours)
- Google Cloud Functions for parallel processing
- 50 concurrent workers
- Automatic retry with dead letter queue
- Cost: ~$0.52/FDD

### Quality Control Checklist
- [ ] Score between 300-600
- [ ] All 4 dimensions populated
- [ ] 3 opportunities + 3 concerns
- [ ] Neutral language (no forbidden words)
- [ ] 200+ chunks in database
- [ ] AI Chat answers correctly

---

## Development Workflow

### Environment Setup
```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_API_KEY
ANTHROPIC_API_KEY
RESEND_API_KEY
DOCUSEAL_API_KEY
SENTRY_DSN
```

### Branch Strategy
- `main` → Production (app.fddhub.com)
- Feature branches → Preview environments
- Staging uses separate Supabase project

### Testing Approach
- Manual QA with staging environment
- Sentry for error monitoring
- Vercel Analytics for performance

---

## Common Tasks

### Adding a New Franchise
1. Process FDD through pipeline
2. Upload analysis.json to Supabase
3. Generate embeddings with correct FDD ID
4. Upload PDF to Supabase storage
5. Create page mappings via admin UI
6. Upload logo

### Creating Custom Pipeline Stages
```sql
INSERT INTO pipeline_stages (franchisor_id, name, color, position)
VALUES ('uuid', 'Stage Name', '#3B82F6', 0);
```

### Adding Team Members
```typescript
// Via API
POST /api/team
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "recruiter" // admin | recruiter | viewer
}
```

### Updating Lead Stage
```typescript
PATCH /api/leads/[id]/stage
{ "stageId": "new-stage-uuid" }
```

---

## Compliance Requirements

### FTC Franchise Rule
- 14-day waiting period enforcement
- Unmodified FDD delivery
- Timestamped consent tracking
- Electronic receipt signing

### AI Guardrails
- No financial performance representations
- Standardized disclaimers on Item 19
- Professional referral language
- Citations required for all claims

### Privacy
- CCPA/CPRA compliant privacy policy
- Consent tracking for all data collection
- Terms of Service required before signup

---

## Troubleshooting

### Common Issues

**PDF not loading:**
- Check pdf_url matches exact filename in storage
- URL-encode spaces and parentheses
- Verify storage bucket is public

**AI Chat returns no results:**
- Verify embeddings exist (check chunk_count)
- Check fdd_id matches in fdd_chunks table
- Test semantic search endpoint directly

**Lead not showing in pipeline:**
- Verify stage_id is set on lead_invitation
- Check RLS policies for user's role
- Ensure team member has access

**Consent not saving:**
- Check consent API endpoint
- Verify RLS allows insert
- Check timestamp columns

---

## Key Contacts & Resources

### Documentation
- `/docs/DATABASE-SCHEMA.md` - Complete schema reference
- `/docs/FINAL_ARCHITECTURE.md` - Platform architecture
- `/FRANCHISESCORE_METHODOLOGY_2_1.md` - Scoring methodology (project file)
- `/scripts/FDD_PROCESSING_GUIDE.md` - Processing workflow
- `/CLOUD_FDD_PROCESSING_GUIDE.md` - Batch processing (project file)

### Monitoring
- Sentry: Error tracking and performance
- Vercel Analytics: Usage and speed insights
- Supabase Dashboard: Database and auth

---

## Current Status (January 2026)

### Completed
- ✅ FranchiseScore™ 2.1 methodology
- ✅ FDD processing pipeline
- ✅ AI chat with semantic search
- ✅ Lead invitation system
- ✅ Custom pipeline stages
- ✅ Team member management
- ✅ DocuSeal integration
- ✅ White-label branding
- ✅ WellBiz pilot (5 brands processed)
- ✅ Sentry + Vercel Analytics

### In Progress
- 🚧 Connect real engagement data to Lead Intelligence
- 🚧 Item 19 AI guardrails
- 🚧 Mobile optimization

### Planned
- 📋 Process 400 franchises for FDDAdvisor launch
- 📋 Insights module (competitive intelligence)
- 📋 CRM integrations

---

*Skill maintained by Paralex, Inc. development team*
