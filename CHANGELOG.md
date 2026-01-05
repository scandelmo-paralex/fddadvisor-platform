# Changelog

All notable changes to the FDDHub & FDDAdvisor platform.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.1.0] - 2026-01-05

### Added
- **Custom Pipeline Stages** - Franchisors can now customize their sales pipeline
  - 8 default stages auto-created for new franchisors
  - Drag-and-drop reordering with @dnd-kit
  - 10 preset colors available
  - Default, Closed Won, Closed Lost indicators
  - API endpoints: `/api/pipeline-stages/*`
  - Lead stage history tracking for audit trail

- **Team Member Management** - Multi-user support for franchisor organizations
  - Three roles: Admin, Recruiter, Viewer
  - Invitation workflow with magic links
  - Role-based access control via RLS policies
  - Lead assignment to team members
  - API endpoints: `/api/team/*`

- **Lead Value Tracking** - Estimated deal value per lead
  - `lead_value` column on `lead_invitations`
  - Displayed in pipeline view

### Changed
- **FranchiseScore Methodology updated to 2.1**
  - Added 3-year recency filter for litigation scoring
  - Only cases filed 2022-2025 are penalized
  - Older resolved cases disclosed but not scored
  - Updated Clean Record scoring guidance

- **Lead Invitations table enhanced**
  - Added `stage_id`, `stage_changed_at`, `stage_changed_by` columns
  - Added `assigned_to` for team member assignment
  - Added `created_by` for audit trail

### Fixed
- Safari browser compatibility issues resolved
- Consent modal saving properly to database

---

## [2.0.5] - 2025-12-15

### Added
- **DocuSeal Integration** for Item 23 receipt signing
  - Electronic signature workflow
  - Webhook integration for completion
  - Signed PDF storage in `lead_fdd_access.receipt_pdf_url`
  - `docuseal_item23_template_url` per franchise

- **Sentry Error Monitoring**
  - Full error tracking with context
  - Performance monitoring enabled
  - 3 alert rules configured
  - Team member access

- **Vercel Analytics**
  - Speed Insights enabled
  - Web Analytics active
  - Real User Monitoring

- **Terms of Service & Privacy Policy pages**
  - `/legal/terms` and `/legal/privacy` routes
  - CCPA/CPRA compliant privacy policy

### Changed
- **Buyer Profiles schema expanded**
  - Added `leadership_experience`, `management_style`
  - Added `team_building_interest`, `operational_involvement`
  - Added `skills`, `industry_expertise` arrays
  - Added `veteran_status`, `years_experience_range`

---

## [2.0.4] - 2025-12-05

### Added
- **WellBiz Brands Portfolio Processing**
  - Drybar (548/600)
  - Elements Massage (508/600)
  - Radiant Waxing (452/600)
  - Amazing Lash Studio (445/600)
  - Fitness Together (429/600)
  - 1,346 total chunks generated

- **Staging Environment**
  - Separate Supabase project for staging
  - Environment variable switching
  - Production backup automation

- **Lead Intelligence Demo Data**
  - Bob Smith test lead with engagement data
  - AI-generated insights templates

### Changed
- PDF viewer Safari compatibility fixes
- Improved mobile responsive design

---

## [2.0.3] - 2025-11-15

### Added
- **FDD Engagements Table** - Detailed engagement tracking
  - Event types: view, question, download, scroll
  - Duration tracking in seconds
  - Questions asked count and list
  - Items viewed array

- **Cover Images for Franchises**
  - `cover_image_url` column added
  - Admin interface for uploading
  - All WellBiz brands have covers

- **City/State Location Fields**
  - Split from single `location` field
  - Better lead qualification data

### Changed
- Improved FDD viewer loading performance
- Enhanced AI chat response quality

---

## [2.0.2] - 2025-11-04

### Added
- **FranchiseScore™ 2.0 Methodology**
  - 600-point scale (from 1000)
  - 4 dimensions (from 5)
  - Neutral language requirements
  - Forbidden words enforcement
  - Calculation formulas shown

- **Item-by-Item Processing Pipeline**
  - `vertex_item_by_item_pipeline.py`
  - Gemini 2.5 Flash for analysis
  - Claude 4.5 Sonnet for synthesis
  - PDFPlumber for extraction

- **Semantic Search with Embeddings**
  - `fdd_chunks` table with pgvector
  - text-embedding-004 (768 dimensions)
  - ~600 token chunks with overlap
  - `match_fdd_chunks` function

### Changed
- Replaced Vertex Vision API with PDFPlumber
- 95% cost savings on FDD processing

---

## [2.0.1] - 2025-10-30

### Added
- **White-Label Settings**
  - `white_label_settings` table
  - Custom logo, colors, header text
  - Per-franchise branding

- **Lead Invitation System**
  - Magic link authentication
  - `lead_invitations` table
  - Email templates via Resend
  - 30-day expiration

- **FDD Item Page Mappings**
  - `fdd_item_page_mappings` table
  - Quick navigation in PDF viewer
  - Items 1-23 and Exhibits

### Changed
- Migrated from single-app to two-product architecture
- Separated FDDAdvisor and FDDHub contexts

---

## [2.0.0] - 2025-10-15

### Added
- **Two-Product Architecture**
  - FDDAdvisor: Free public research
  - FDDHub: B2B SaaS for franchisors
  - Shared authentication system

- **Lead FDD Access Control**
  - `lead_fdd_access` table
  - `granted_via` tracking
  - Consent and receipt timestamps

- **Buyer Demographics Collection**
  - Investment range
  - Industries interested
  - Buying timeline
  - Business experience

### Changed
- Complete database schema redesign
- New route structure for /hub/*
- Row Level Security policies for multi-tenant

---

## [1.0.0] - 2025-09-01

### Added
- Initial platform release
- FDD viewer with PDF rendering
- Basic franchise listings
- User authentication via Supabase
- AI chat placeholder

---

## Migration Notes

### Upgrading to 2.1.0
1. Run `scripts/118-pipeline-stages-feature.sql`
2. Run `scripts/119-pipeline-lead-value.sql`
3. Install `@dnd-kit` packages: `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
4. Deploy updated API routes

### Upgrading to 2.0.5
1. Run `scripts/112-create-franchisor-team-members.sql`
2. Configure Sentry DSN in environment variables
3. Enable Vercel Analytics in project settings

### Database Backup
Always backup production database before running migrations:
```bash
# Via Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql
```

---

*Changelog maintained by development team*
