# Two-Product Architecture Implementation Guide

## Overview

This document outlines the implementation of the two-product architecture:
- **FDDAdvisor**: Free buyer discovery platform (fddadvisor.com)
- **FDDHub**: Franchisor SaaS dashboard (fddhub.com)

## Product Separation

### FDDAdvisor (fddadvisor.com)
**Purpose**: Free research platform for buyers + competitive intelligence data collection

**Features**:
- Public browsing of franchise listings
- AI Discovery Assistant (no auth required)
- FDD Viewer access (requires account creation)
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

### FDDHub (fddhub.com)
**Purpose**: Franchisor SaaS platform for lead management

**Features**:
- Franchisor dashboard (existing features)
- Lead invitation system
- Lead dashboard (view received FDDs)
- White-labeled FDD Viewer
- Lead Intelligence Reports (included in base)
- Insights module (paid add-on)

**Franchisor Flow**:
1. Franchisor uploads FDD
2. Franchisor adds lead (email, name, phone)
3. System sends invitation email with magic link
4. Lead clicks link → auto-creates account (or logs in if existing)
5. First-time users set password
6. Lead sees dashboard with all FDDs they've received
7. Each FDD Viewer is white-labeled for that franchise
8. Franchisor receives lead intelligence reports

**Lead Flow**:
1. Receives email: "You've been invited to view [Franchise Name] FDD"
2. Clicks link with unique token
3. If new user: Auto-creates account, prompts for password + light demographics
4. If existing user: Logs in automatically
5. Lands on personal dashboard showing all FDDs received
6. Clicks FDD → white-labeled viewer with franchise branding
7. All activity tracked and reported to franchisor

## Database Schema

### New Tables

**lead_invitations**
- Tracks franchisor invitations to leads
- Contains unique token for magic link
- Status: sent, viewed, signed_up, expired
- Links to buyer_profile after signup

**lead_fdd_access**
- Tracks which FDDs each buyer can view
- Granted via 'invitation' or 'fddadvisor_signup'
- Tracks viewing metrics (views, time spent)
- Unique constraint on (buyer_id, franchise_id)

**white_label_settings**
- Customization per franchise
- Logo URL, primary color, accent color
- Custom header text
- Contact info override

### Modified Tables

**buyer_profiles** - Added demographics fields:
- investment_range_min/max
- industries_interested
- buying_timeline
- current_occupation
- business_experience_years
- has_franchise_experience
- preferred_location
- signup_source ('fddadvisor' or 'fddhub')

## Route Structure

### FDDAdvisor Routes
\`\`\`
/                           → Public homepage
/browse                     → Browse franchises (public)
/discover                   → AI Discovery Assistant (public)
/fdd/[id]                   → FDD Viewer (requires auth)
/signup                     → Signup with demographics
/login                      → Login
\`\`\`

### FDDHub Routes
\`\`\`
/hub/dashboard              → Franchisor dashboard
/hub/leads                  → Lead management
/hub/leads/invite           → Send FDD invitation
/hub/settings               → Company settings
/hub/white-label/[id]       → White label customization

/hub/my-fdds                → Lead's personal dashboard
/hub/fdd/[id]               → White-labeled FDD viewer
/hub/invite/[token]         → Magic link landing page
\`\`\`

## Authentication Flows

### FDDAdvisor Signup
1. User clicks "View FDD" without account
2. Redirect to `/signup?redirect=/fdd/[id]`
3. Signup form collects:
   - Email, password, name
   - Investment range
   - Industries interested
   - Buying timeline
   - Other demographics
4. After signup → redirect to FDD
5. Create `lead_fdd_access` record with `granted_via: 'fddadvisor_signup'`

### FDDHub Invitation
1. Franchisor sends invitation via `/hub/leads/invite`
2. System creates `lead_invitations` record with unique token
3. Email sent with link: `fddhub.com/hub/invite/[token]`
4. Lead clicks link:
   - If new: Auto-create account, prompt for password + demographics
   - If existing: Auto-login
5. Update invitation status to 'signed_up'
6. Trigger auto-creates `lead_fdd_access` record
7. Redirect to `/hub/my-fdds`

## White-Label Implementation

### Customization Options (Option B - Moderate)
- Logo URL
- Primary brand color
- Accent color
- Custom header text

### FDD Viewer Modes
\`\`\`typescript
interface FDDViewerProps {
  franchiseId: string
  mode: 'public' | 'white-label'
  whiteLabelSettings?: WhiteLabelSettings
}
\`\`\`

**Public Mode** (FDDAdvisor):
- Standard FDDAdvisor branding
- No "Connect" buttons
- Standard color scheme

**White-Label Mode** (FDDHub):
- Custom logo in header
- Custom colors applied
- Custom header text
- Franchisor contact info
- "Contact Us" button (not "Connect")

## Insights Module (Paid Add-On)

### Included in Base FDDHub:
- Lead Intelligence Reports
- Basic engagement metrics
- Lead qualification tracking

### Insights Module (Paid):
- Competitive benchmarking from FDDAdvisor data
- Market trends and analytics
- Sales pipeline insights
- Industry comparisons
- Buyer behavior patterns
- Conversion funnel analysis

## Implementation Checklist

### Phase 1: Database & Auth (Week 1)
- [ ] Run `08-two-product-architecture.sql`
- [ ] Update buyer signup to collect demographics
- [ ] Implement magic link authentication
- [ ] Create lead invitation system

### Phase 2: FDDAdvisor (Week 1-2)
- [ ] Remove "Connect" buttons from public views
- [ ] Add auth gate for FDD Viewer
- [ ] Create demographics signup form
- [ ] Update AI Discovery Assistant

### Phase 3: FDDHub Lead Features (Week 2)
- [ ] Build lead invitation UI
- [ ] Create lead dashboard (`/hub/my-fdds`)
- [ ] Implement magic link landing page
- [ ] Add FDD access management

### Phase 4: White-Label (Week 2-3)
- [ ] Create white-label settings UI
- [ ] Implement white-label FDD Viewer mode
- [ ] Add color/logo customization
- [ ] Test white-label rendering

### Phase 5: Insights Module (Week 3-4)
- [ ] Design insights dashboard
- [ ] Build competitive benchmarking views
- [ ] Add market trends analytics
- [ ] Implement sales pipeline insights
- [ ] Create paywall/upgrade flow

## API Endpoints

### FDDAdvisor
\`\`\`
GET  /api/franchises              → List all franchises (public)
GET  /api/franchises/[id]         → Get franchise details (public)
POST /api/auth/signup             → Signup with demographics
GET  /api/fdd/[id]                → Get FDD (requires auth)
POST /api/fdd/[id]/track-view     → Track FDD viewing
\`\`\`

### FDDHub
\`\`\`
POST /api/hub/invitations         → Send FDD invitation
GET  /api/hub/invitations         → List invitations
GET  /api/hub/invite/[token]      → Validate invitation token
POST /api/hub/invite/[token]/accept → Accept invitation
GET  /api/hub/my-fdds             → Get lead's accessible FDDs
GET  /api/hub/fdd/[id]            → Get white-labeled FDD
GET  /api/hub/white-label/[id]    → Get white-label settings
PUT  /api/hub/white-label/[id]    → Update white-label settings
\`\`\`

## Next Steps

1. Run the SQL migration script
2. Update authentication to support magic links
3. Create demographics signup form
4. Build lead invitation system
5. Implement white-label FDD Viewer
6. Test both product flows end-to-end
