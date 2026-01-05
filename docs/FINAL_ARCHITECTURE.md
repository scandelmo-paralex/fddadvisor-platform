# FDDAdvisor + FDDHub: Platform Architecture

> **Last Updated:** January 5, 2026  
> **Status:** Production  
> **Version:** 2.1

---

## Overview

Two products, one account system, context-based separation.

| Product | Domain | Purpose |
|---------|--------|---------|
| **FDDAdvisor** | fddadvisor.com | Free public research platform for franchise buyers |
| **FDDHub** | app.fddhub.com | B2B SaaS for franchisors - lead management & FDD distribution |

---

## Product Architecture

### 1. FDDAdvisor (fddadvisor.com)

**Purpose:** Free, independent research platform - "The Carfax for Franchises"

**Key Principles:**
- 100% free for buyers
- No lead capture or franchisor payments
- Complete editorial independence
- FranchiseScore credibility must be protected

**Features:**
- Browse all 400+ franchises
- AI Discovery Assistant recommendations
- FranchiseScore™ ratings (0-600 points)
- Compare franchises side-by-side
- AI-powered FDD analysis and chat
- **Requires account** to view FDD Viewer (collects demographics)

**User Flow:**
1. Visit fddadvisor.com
2. Browse/search franchises or use AI Discovery
3. Click to view FDD → prompted to create account (if not logged in)
4. Create account with demographics (investment range, industries, timeline)
5. View FDD Viewer with full analysis and AI chat

**Revenue Model:** None directly - supports FDDHub competitive intelligence

### 2. FDDHub (app.fddhub.com)

**Purpose:** Franchisor SaaS platform for compliant FDD delivery and lead management

**Pricing Tiers:**
- Starter: $299/month
- Professional: $699/month  
- Enterprise: $1,497/month
- Commission: 5-10% vs industry standard 35-50%

**Features:**
- FDD invitation system with magic links
- 14-day compliance tracking
- Lead engagement analytics
- Custom pipeline stages (8 defaults, fully customizable)
- Team member management (admin/recruiter/viewer roles)
- White-label branded FDD viewer
- DocuSeal integration for Item 23 receipt signing
- Lead Intelligence reports
- **Insights Module (Premium):** Competitive intelligence from FDDAdvisor data

---

## Two User Types in FDDHub

### A. Franchisors
- Send FDD invitations to leads
- Track lead engagement and disclosure compliance
- View lead intelligence reports
- Manage custom pipeline stages
- Add team members with role-based access
- Configure white-label branding
- **Insights Module (Premium):** See what else leads are researching

### B. Leads (Invited Buyers)
- Receive email invitation from franchisor
- Create account via magic link
- View ONLY FDDs they were invited to see
- Personal dashboard shows all invited FDDs (from multiple franchisors)
- Each FDD Viewer is white-labeled per franchise
- Can give consent and sign Item 23 receipt electronically

---

## Shared Account System

**Key Principle:** One account, two contexts

### Same User, Different Experiences:

**Scenario:** John receives FDD invitation from Franchise A (FDDHub), but also wants to research competitors.

1. **FDDHub Context** (`app.fddhub.com/hub/my-fdds`)
   - Shows ONLY Franchise A (what he was invited to)
   - White-labeled with Franchise A branding
   - No browse/search functionality

2. **FDDAdvisor Context** (`fddadvisor.com`)
   - Shows ALL 400+ franchises
   - Can browse, search, compare
   - Full discovery platform

3. **Competitive Intelligence** (Insights Module)
   - Franchise A's franchisor sees: "John also viewed Franchises B, C, D"
   - Gets alerts when John views competitors
   - Can proactively address objections

---

## Database Architecture

### Core Tables

```
buyer_profiles
├── id (UUID)
├── user_id (auth.users)
├── email
├── demographics (investment_range, industries, timeline, etc.)
├── qualifications (fico, assets, net_worth, etc.)
├── skills & expertise
└── signup_source ('fddadvisor' or 'fddhub')

franchises
├── id, name, slug
├── franchise_score (0-600)
├── franchise_score_breakdown (JSONB)
├── opportunities & concerns (JSONB)
├── analytical_summary
├── Item 7/19/20 data
└── docuseal_item23_template_url

lead_invitations
├── franchisor_id, franchise_id
├── lead_email, invitation_token
├── status (sent, viewed, signed_up, expired)
├── stage_id (links to pipeline_stages)
├── assigned_to (links to team_members)
└── buyer_id (linked after signup)

lead_fdd_access
├── buyer_id, franchise_id
├── granted_via ('invitation' or 'fddadvisor_signup')
├── consent_given_at, receipt_signed_at
├── docuseal_submission_id
└── viewing_stats (views, time_spent)

pipeline_stages
├── franchisor_id
├── name, color, position
├── is_default, is_closed_won, is_closed_lost
└── 8 default stages per franchisor

franchisor_team_members
├── franchisor_id, user_id, email
├── role ('admin', 'recruiter', 'viewer')
├── status ('invited', 'active', 'deactivated')
└── invitation_token, accepted_at
```

### Vector Search (Semantic)

```
fdd_chunks
├── fdd_id
├── chunk_text (600 tokens avg)
├── item_number (1-23)
├── page_number, start_page, end_page
├── embedding (vector 768)
└── metadata (JSONB)
```

---

## Route Structure

### FDDAdvisor Routes
```
/                           → Public homepage
/discover                   → AI Discovery Assistant
/fdd/[slug]                 → FDD Viewer (requires auth)
/signup                     → Signup with demographics
/login                      → Login
/legal/terms                → Terms of Service
/legal/privacy              → Privacy Policy
```

### FDDHub Routes
```
/hub/dashboard              → Franchisor dashboard (redirects to leads)
/hub/leads                  → Lead management with pipeline
/hub/company-settings       → Company settings + Pipeline stages + Team
/hub/my-fdds                → Lead's personal dashboard
/hub/fdd/[franchiseId]      → White-labeled FDD viewer
/hub/invite/[token]         → Magic link landing page
/hub/settings               → User settings
```

### Admin Routes
```
/admin/fdd-processing       → FDD upload and processing
/admin/fdd/[id]/item-mapping → Manual item page mapping
/admin/cover-images         → Manage cover images
/admin/reset-password       → Admin password reset
```

---

## Authentication Flows

### FDDAdvisor Signup
1. User clicks "View FDD" without account
2. Redirect to `/signup?redirect=/fdd/[slug]`
3. Signup form collects demographics
4. After signup → redirect to FDD
5. Create `lead_fdd_access` record with `granted_via: 'fddadvisor_signup'`

### FDDHub Invitation
1. Franchisor sends invitation via leads page
2. System creates `lead_invitations` record with unique token
3. Email sent via Resend with magic link
4. Lead clicks link:
   - If new: Creates account, prompted for password + demographics
   - If existing: Auto-login
5. Update invitation status to 'signed_up'
6. Auto-create `lead_fdd_access` record
7. Redirect to `/hub/my-fdds`

### Team Member Invitation
1. Franchisor owner invites team member
2. System creates `franchisor_team_members` record
3. Email sent with invitation link
4. Team member clicks link → `/team-signup`
5. Creates auth account, links user_id
6. Redirected to dashboard with role-based access

---

## Pipeline Stages System

### Default Stages (auto-created for new franchisors)

| Position | Name | Color | Type |
|----------|------|-------|------|
| 0 | New Lead | Blue | Default |
| 1 | Contacted | Purple | - |
| 2 | Qualified | Cyan | - |
| 3 | Discovery Call | Amber | - |
| 4 | FDD Review | Pink | - |
| 5 | Negotiation | Green | - |
| 6 | Closed Won | Green | Closed Won |
| 7 | Closed Lost | Red | Closed Lost |

### Customization
- Franchisors can add/edit/delete stages
- Drag-and-drop reordering
- 10 preset colors available
- Only one default, one closed won, one closed lost per franchisor
- Cannot delete stage with assigned leads

---

## Team Member Roles

| Role | Leads Access | Stage Management | Team Management | Settings |
|------|-------------|------------------|-----------------|----------|
| Owner | All | Full | Full | Full |
| Admin | All | Full | Full | Full |
| Recruiter | Assigned only | Move leads | None | None |
| Viewer | Read-only | None | None | None |

---

## White-Label Implementation

### Customization Options
- Logo URL
- Primary brand color
- Accent color
- Custom header text
- Contact email override
- Contact phone override

### FDD Viewer Modes

**Public Mode** (FDDAdvisor):
- Standard FDDAdvisor branding
- No "Connect" buttons
- Standard color scheme

**White-Label Mode** (FDDHub):
- Custom logo in header
- Custom colors applied
- Custom header text
- Franchisor contact info
- "Contact Us" button

---

## Compliance Features

### FTC Franchise Rule Compliance
- 14-day waiting period enforced via `consent_given_at` timestamp
- FDD delivered as unmodified PDF
- Electronic receipt signing via DocuSeal
- Timestamped audit trail for all consents

### DocuSeal Integration
- Item 23 receipt templates per franchise
- `docuseal_item23_template_url` in franchises table
- Webhook captures signed PDF and submission ID
- Stored in `lead_fdd_access.receipt_pdf_url`

### AI Guardrails
- Item 19 questions filtered for FPR compliance
- Standardized disclaimers on financial information
- Professional referral language required
- Monthly compliance review of chatbot responses

---

## Lead Intelligence

### Engagement Tracking
```
fdd_engagements
├── Event types: view, question, download, scroll
├── Page/section tracking
├── Duration in seconds
├── Questions asked (count and list)
├── Items viewed (array)
```

### Lead Score Calculation
```
Base: 50 points (verified lead)
+ Time: 2 pts/minute (max 20)
+ Questions: 4 pts each (max 15)
+ Coverage: 1 pt/section (max 5)
+ Frequency: 2 pts/visit (max 10)
= Total Score (50-100)
```

### Intent Classification
- 🔥 Hot (90-100): Active, deep engagement
- 🟢 High (75-89): Strong interest signals
- 🟡 Medium (50-74): Casual browsing
- ⚪ Low (<50): Just opened

---

## Insights Module (Premium Add-On)

### Included in Base FDDHub:
- Lead Intelligence Reports
- Basic engagement metrics
- Lead qualification tracking

### Insights Module Features:
- Competitive benchmarking from FDDAdvisor data
- "Your lead also viewed: Franchise B, C, D"
- Market trends and analytics
- Sales pipeline insights
- Industry comparisons
- Buyer behavior patterns
- Conversion funnel analysis

---

## API Endpoints Summary

### FDDAdvisor
```
GET  /api/franchises/public    → List all franchises
GET  /api/fdd/[id]             → Get FDD details
POST /api/fdd-chat             → AI chat endpoint
GET  /api/fdd/[id]/search      → Semantic search
```

### FDDHub
```
POST /api/hub/invitations      → Send FDD invitation
GET  /api/hub/leads            → List leads with pipeline
PATCH /api/leads/[id]/stage    → Update lead stage
GET  /api/hub/fdd-access       → Get buyer's FDD access
POST /api/hub/fdd-access/consent → Record consent
```

### Pipeline Stages
```
GET  /api/pipeline-stages      → List stages
POST /api/pipeline-stages      → Create stage
PATCH /api/pipeline-stages/[id] → Update stage
DELETE /api/pipeline-stages/[id] → Delete stage
POST /api/pipeline-stages/reorder → Reorder stages
```

### Team Management
```
GET  /api/team                 → List team members
POST /api/team                 → Invite team member
PUT  /api/team/[id]            → Update member
DELETE /api/team/[id]          → Deactivate member
POST /api/team/accept          → Accept invitation
```

---

## Implementation Status

### ✅ Completed
- [x] Database schema with all tables
- [x] Enhanced signup with demographics
- [x] Lead invitation system with magic links
- [x] Lead dashboard (shows only invited FDDs)
- [x] White-label FDD viewer
- [x] White-label settings management UI
- [x] Custom pipeline stages (8 defaults)
- [x] Team member management
- [x] DocuSeal integration for Item 23
- [x] Consent tracking and timestamping
- [x] Engagement tracking (fdd_engagements)
- [x] AI chat with semantic search
- [x] FranchiseScore™ 2.1 methodology
- [x] 5 WellBiz brands processed
- [x] Sentry error monitoring
- [x] Vercel Analytics
- [x] Terms of Service & Privacy Policy pages

### 🚧 In Progress
- [ ] Connect real engagement data to Lead Intelligence
- [ ] Item 19 AI guardrails
- [ ] Page mappings for WellBiz brands
- [ ] Mobile optimization

### 📋 Planned
- [ ] Cloud FDD processing (400 FDDs)
- [ ] FDDAdvisor public launch
- [ ] Insights module
- [ ] CRM integrations

---

## Monitoring & Operations

### Sentry Configuration
- Error tracking with full context
- Performance monitoring
- Alert rules for critical issues
- Team access (3 alert rules active)

### Vercel
- Auto-deploy on push to main
- Preview environments for branches
- Speed Insights enabled
- Analytics enabled

### Supabase
- Daily backups at 4 AM
- Row Level Security on all tables
- Connection pooling enabled

---

## Next Steps (Priority Order)

1. **WellBiz Demo Completion**
   - Fix consent saving
   - Connect real engagement data
   - Complete page mappings

2. **Scale to 400 Franchises**
   - Cloud processing pipeline
   - Batch FDD upload

3. **Public Launch**
   - FDDAdvisor with 400 franchises
   - Marketing site updates
   - SEO optimization

4. **Premium Features**
   - Insights module
   - Advanced analytics
   - CRM integrations

---

*Architecture documentation maintained by development team*  
*Last Review: January 5, 2026*
