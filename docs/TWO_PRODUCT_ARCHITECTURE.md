# Two-Product Architecture Implementation Guide

> **Last Updated:** January 5, 2026  
> **Status:** Production - Phase 4 Complete

---

## Overview

This document outlines the implementation of the two-product architecture:
- **FDDAdvisor**: Free buyer discovery platform (fddadvisor.com)
- **FDDHub**: Franchisor SaaS dashboard (app.fddhub.com)

---

## Product Separation

### FDDAdvisor (fddadvisor.com)
**Purpose**: Free research platform for buyers + competitive intelligence data collection

**Features**:
- Public browsing of franchise listings
- AI Discovery Assistant (no auth required)
- FDD Viewer access (requires account creation)
- FranchiseScore™ 2.1 ratings
- Light profile signup with demographics
- NO "Connect" buttons
- NO direct franchisor/lender connections

**User Flow**:
1. User browses franchises publicly
2. User chats with AI Discovery Assistant
3. User clicks to view FDD → prompted to create account
4. Account creation collects demographics:
   - Name, email, password
   - Investment range (min/max)
   - Industries interested in
   - Buying timeline
   - Current occupation
   - Business experience
   - Franchise experience (yes/no)
   - Preferred location
5. After signup → can view any FDD in the system
6. All viewing data collected for competitive intelligence

### FDDHub (app.fddhub.com)
**Purpose**: Franchisor SaaS platform for lead management

**Features**:
- Franchisor dashboard (existing features)
- Lead invitation system with magic links
- Custom pipeline stages (8 defaults, fully customizable)
- Team member management (admin/recruiter/viewer roles)
- Lead dashboard (view received FDDs)
- White-labeled FDD Viewer
- DocuSeal integration for Item 23 receipt signing
- Lead Intelligence Reports (included in base)
- Insights module (paid add-on - planned)

**Franchisor Flow**:
1. Franchisor uploads FDD (admin process)
2. Franchisor adds lead (email, name, phone)
3. System sends invitation email with magic link
4. Lead clicks link → auto-creates account (or logs in if existing)
5. First-time users set password
6. Lead sees dashboard with all FDDs they've received
7. Each FDD Viewer is white-labeled for that franchise
8. Franchisor receives lead intelligence reports
9. Franchisor can move leads through custom pipeline stages

**Lead Flow**:
1. Receives email: "You've been invited to view [Franchise Name] FDD"
2. Clicks link with unique token
3. If new user: Auto-creates account, prompts for password + light demographics
4. If existing user: Logs in automatically
5. Lands on personal dashboard showing all FDDs received
6. Gives consent for FDD viewing
7. Signs Item 23 receipt via DocuSeal
8. Clicks FDD → white-labeled viewer with franchise branding
9. All activity tracked and reported to franchisor

---

## Database Schema

### Core Tables

**lead_invitations**
- Tracks franchisor invitations to leads
- Contains unique token for magic link
- Status: sent, viewed, signed_up, expired
- Links to buyer_profile after signup
- Links to pipeline_stages via stage_id
- Links to team_members via assigned_to

**lead_fdd_access**
- Tracks which FDDs each buyer can view
- Granted via 'invitation' or 'fddadvisor_signup'
- Tracks viewing metrics (views, time spent)
- Stores consent and receipt timestamps
- Stores DocuSeal submission data
- Unique constraint on (buyer_id, franchise_id)

**white_label_settings**
- Customization per franchise
- Logo URL, primary color, accent color
- Custom header text
- Contact info override

**pipeline_stages**
- Custom stages per franchisor
- 8 default stages auto-created
- Position for ordering
- is_default, is_closed_won, is_closed_lost flags

**franchisor_team_members**
- Team members linked to franchisor organization
- Roles: admin, recruiter, viewer
- Invitation workflow with token
- Status: invited, active, deactivated

### Buyer Profile Demographics

**buyer_profiles** includes:
- investment_range_min/max
- industries_interested
- buying_timeline
- current_occupation
- business_experience_years
- has_franchise_experience
- preferred_location
- city_location, state_location
- signup_source ('fddadvisor' or 'fddhub')
- Financial qualifications (fico, assets, net_worth)
- Skills and expertise arrays
- Consent timestamps

---

## Route Structure

### FDDAdvisor Routes
```
/                           → Public homepage
/discover                   → AI Discovery Assistant (public)
/fdd/[slug]                 → FDD Viewer (requires auth)
/signup                     → Signup with demographics
/login                      → Login
/legal/terms                → Terms of Service
/legal/privacy              → Privacy Policy
```

### FDDHub Routes
```
/hub/leads                  → Lead management with pipeline
/hub/company-settings       → Company settings + Pipeline + Team
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
```

---

## Authentication Flows

### FDDAdvisor Signup
1. User clicks "View FDD" without account
2. Redirect to `/signup?redirect=/fdd/[slug]`
3. Signup form collects:
   - Email, password, name
   - Investment range
   - Industries interested
   - Buying timeline
   - Other demographics
4. After signup → redirect to FDD
5. Create `lead_fdd_access` record with `granted_via: 'fddadvisor_signup'`

### FDDHub Invitation
1. Franchisor sends invitation via `/hub/leads`
2. System creates `lead_invitations` record with unique token
3. Email sent via Resend with link: `app.fddhub.com/hub/invite/[token]`
4. Lead clicks link:
   - If new: Auto-create account, prompt for password + demographics
   - If existing: Auto-login
5. Update invitation status to 'signed_up'
6. Auto-create `lead_fdd_access` record
7. Redirect to `/hub/my-fdds`

### Team Member Invitation
1. Franchisor owner invites team member via company settings
2. System creates `franchisor_team_members` record with token
3. Email sent with invitation link
4. Team member creates account via `/team-signup`
5. Links user_id to team member record
6. Redirects to dashboard with role-based access

---

## Pipeline Stages

### Default Stages (8)
| Position | Name | Color | Type |
|----------|------|-------|------|
| 0 | New Lead | Blue (#3B82F6) | Default |
| 1 | Contacted | Purple (#8B5CF6) | - |
| 2 | Qualified | Cyan (#06B6D4) | - |
| 3 | Discovery Call | Amber (#F59E0B) | - |
| 4 | FDD Review | Pink (#EC4899) | - |
| 5 | Negotiation | Green (#10B981) | - |
| 6 | Closed Won | Green (#22C55E) | Closed Won |
| 7 | Closed Lost | Red (#EF4444) | Closed Lost |

### Customization
- Franchisors can add/edit/delete/reorder stages
- Drag-and-drop interface
- 10 preset colors
- Cannot delete stage with assigned leads

---

## Team Member Roles

| Role | Leads | Stages | Team | Settings |
|------|-------|--------|------|----------|
| Owner | All | Full | Full | Full |
| Admin | All | Full | Full | Full |
| Recruiter | Assigned | Move | None | None |
| Viewer | Read | None | None | None |

---

## White-Label Implementation

### Customization Options (Implemented)
- Logo URL
- Primary brand color
- Accent color
- Custom header text
- Contact email override
- Contact phone override

### FDD Viewer Modes

**Public Mode** (FDDAdvisor):
- Standard FDDAdvisor branding
- FranchiseScore™ display
- No "Connect" buttons
- Standard color scheme

**White-Label Mode** (FDDHub):
- Custom logo in header
- Custom colors applied
- Custom header text
- Franchisor contact info
- "Contact Us" button (not "Connect")
- DocuSeal receipt signing

---

## Compliance Features

### FTC Franchise Rule
- 14-day waiting period tracking
- Unmodified FDD delivery
- Timestamped consents
- Electronic receipt signing

### DocuSeal Integration
- Item 23 receipt templates per franchise
- Webhook for completion tracking
- Signed PDF storage
- Audit trail

---

## Competitive Intelligence Tracking

### What Gets Tracked:
When a lead (invited to Franchise A) views other franchises in FDDAdvisor:
- Which franchises they viewed
- Time spent on each
- Which Items they focused on
- Questions asked to AI
- Comparison activity

### Where It Shows Up:

**Base FDDHub:** Lead intelligence on YOUR FDD only
- Time spent viewing your FDD
- Which sections they read
- Questions asked
- Disclosure status

**Insights Module (Premium - Planned):** Competitive intelligence
- "Your lead also viewed: Franchise B, C, D"
- Comparison metrics
- Competitive positioning data
- Market trends and benchmarking

---

## Implementation Checklist

### Phase 1: Database & Auth ✅ COMPLETE
- [x] Run `08-two-product-architecture.sql`
- [x] Update buyer signup to collect demographics
- [x] Implement magic link authentication
- [x] Create lead invitation system

### Phase 2: FDDAdvisor ✅ COMPLETE
- [x] Remove "Connect" buttons from public views
- [x] Add auth gate for FDD Viewer
- [x] Create demographics signup form
- [x] Update AI Discovery Assistant

### Phase 3: FDDHub Lead Features ✅ COMPLETE
- [x] Build lead invitation UI
- [x] Create lead dashboard (`/hub/my-fdds`)
- [x] Implement magic link landing page
- [x] Add FDD access management

### Phase 4: White-Label ✅ COMPLETE
- [x] Create white-label settings UI
- [x] Implement white-label FDD Viewer mode
- [x] Add color/logo customization
- [x] Test white-label rendering

### Phase 5: Pipeline & Team ✅ COMPLETE
- [x] Custom pipeline stages
- [x] Drag-and-drop reordering
- [x] Team member management
- [x] Role-based access control

### Phase 6: Compliance ✅ COMPLETE
- [x] DocuSeal integration
- [x] Consent tracking
- [x] Receipt signing workflow
- [x] Audit trail

### Phase 7: Insights Module 📋 PLANNED
- [ ] Design insights dashboard
- [ ] Build competitive benchmarking views
- [ ] Add market trends analytics
- [ ] Implement sales pipeline insights
- [ ] Create paywall/upgrade flow

---

## API Endpoints

### FDDAdvisor
```
GET  /api/franchises/public       → List all franchises (public)
GET  /api/franchises/[id]         → Get franchise details (public)
POST /api/auth/signup             → Signup with demographics
GET  /api/fdd/[id]                → Get FDD (requires auth)
POST /api/fdd-chat                → AI chat
GET  /api/fdd/[id]/search         → Semantic search
```

### FDDHub
```
POST /api/hub/invitations         → Send FDD invitation
GET  /api/hub/leads               → List leads with pipeline data
GET  /api/hub/invite/[token]      → Validate invitation token
POST /api/hub/invite/[token]/accept → Accept invitation
GET  /api/hub/fdd-access          → Get lead's accessible FDDs
POST /api/hub/fdd-access/consent  → Record consent
```

### Pipeline Stages
```
GET  /api/pipeline-stages         → List stages
POST /api/pipeline-stages         → Create stage
PATCH /api/pipeline-stages/[id]   → Update stage
DELETE /api/pipeline-stages/[id]  → Delete stage
POST /api/pipeline-stages/reorder → Reorder stages
PATCH /api/leads/[id]/stage       → Update lead stage
```

### Team Management
```
GET  /api/team                    → List team members
POST /api/team                    → Invite team member
PUT  /api/team/[id]               → Update member
DELETE /api/team/[id]             → Deactivate member
POST /api/team/accept             → Accept invitation
POST /api/team/[id]/resend        → Resend invitation
```

---

## Privacy & Transparency

### User Disclosure
During signup: "Your research activity may be shared with franchisors who have invited you to view their FDDs. This helps them provide better support during your franchise selection process."

### Franchisor Terms
- Can see competitive research for THEIR leads only
- Cannot see other franchisors' leads
- Data used for lead intelligence only, not sold to third parties

---

## Next Steps

1. **Connect Real Engagement Data** - Wire fdd_engagements to Lead Intelligence
2. **Item 19 AI Guardrails** - Prevent FPR responses
3. **Process 400 FDDs** - Cloud pipeline for FDDAdvisor launch
4. **Build Insights Module** - Competitive intelligence premium feature
5. **CRM Integrations** - HubSpot, Salesforce connectors

---

*Document maintained by development team*  
*Last Review: January 5, 2026*
