# FDDAdvisor + FDDHub: Final Architecture

## Overview

Two products, one account system, context-based separation.

## Products

### 1. FDDAdvisor (fddadvisor.com)
**Purpose:** Free public discovery platform for franchise research

**Features:**
- Browse all 400+ franchises
- AI Discovery Assistant recommendations
- Compare franchises side-by-side
- View FDD analyses and data
- **Requires account** to view FDD Viewer (collects demographics)

**User Flow:**
1. Visit fddadvisor.com
2. Browse/search franchises or use AI Discovery
3. Click to view FDD → prompted to create account (if not logged in)
4. Create account with demographics (investment range, industries, timeline, etc.)
5. View FDD Viewer with full analysis

### 2. FDDHub (fddhub.com)
**Purpose:** Franchisor SaaS + Lead Management Platform

**Two User Types:**

#### A. Franchisors
- Send FDD invitations to leads
- Track lead engagement and disclosure compliance
- View lead intelligence reports
- Manage white-label branding
- **Insights Module (Premium):** Competitive intelligence on what leads research

#### B. Leads (Invited Buyers)
- Receive email invitation from franchisor
- Create account via magic link
- View ONLY FDDs they were invited to see
- Personal dashboard shows all invited FDDs (from multiple franchisors)
- Each FDD Viewer is white-labeled per franchise

**Lead Flow:**
1. Franchisor sends invitation to john@example.com
2. John receives email with magic link
3. Clicks link → creates account (or logs in if exists)
4. Sees dashboard with invited FDD(s)
5. Views white-labeled FDD Viewer

## Shared Account System

**Key Principle:** One account, two contexts

### Same User, Different Experiences:

**Scenario:** John receives FDD invitation from Franchise A (FDDHub), but also wants to research competitors.

1. **FDDHub Context** (`fddhub.com/hub/my-fdds`)
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

### Database Structure:

\`\`\`
buyer_profiles
├── id (UUID)
├── user_id (auth.users)
├── email
├── demographics (investment_range, industries, timeline, etc.)
└── signup_source ('fddadvisor' or 'fddhub')

lead_fdd_access (tracks invited FDDs)
├── buyer_id
├── franchise_id
├── franchisor_id
├── granted_via ('invitation' or 'fddadvisor_signup')
├── viewing_stats (first_viewed, last_viewed, total_views, time_spent)

lead_invitations
├── franchisor_id
├── franchise_id
├── lead_email
├── invitation_token
├── status (sent, viewed, signed_up, expired)
└── buyer_id (linked after signup)
\`\`\`

## Competitive Intelligence Tracking

### What Gets Tracked:

When a lead (invited to Franchise A) views other franchises in FDDAdvisor:
- Which franchises they viewed
- Time spent on each
- Which Items they focused on
- Comparison activity

### Where It Shows Up:

**Base FDDHub:** Lead intelligence on YOUR FDD only
- Time spent viewing your FDD
- Which sections they read
- Disclosure status

**Insights Module (Premium):** Competitive intelligence
- "Your lead also viewed: Franchise B, C, D"
- Comparison metrics
- Competitive positioning data
- Market trends and benchmarking

## Franchisor Messaging

### Sales Pitch:
"Your prospects are already researching competitors on Google, Franchise.com, and Reddit. With FDDHub + Insights, you get visibility into their entire research journey and can address objections before your competitors do."

### Value Props:
1. **Lead Intelligence** - Know exactly how engaged your leads are
2. **Competitive Visibility** - See what else they're researching
3. **Proactive Positioning** - Address objections before competitors
4. **Better Qualification** - Understand if they're serious buyers
5. **Higher Close Rates** - Data-driven follow-up strategies

## Privacy & Transparency

### User Disclosure:
During signup: "Your research activity may be shared with franchisors who have invited you to view their FDDs. This helps them provide better support during your franchise selection process."

### Franchisor Terms:
- Can see competitive research for THEIR leads only
- Cannot see other franchisors' leads
- Data used for lead intelligence only, not sold to third parties

## Implementation Status

### ✅ Completed:
- Database schema with all tables
- Enhanced signup with demographics
- Lead invitation system
- Lead dashboard (shows only invited FDDs)
- White-label FDD viewer
- White-label settings management UI
- API endpoints for invitations and access control

### 🚧 Still Needed:
1. **FDDAdvisor Public Discovery**
   - Homepage with AI Discovery
   - Browse/search all franchises
   - Franchise listing pages
   - Auth gate for FDD Viewer access

2. **Competitive Intelligence Tracking**
   - Track when leads view franchises in FDDAdvisor
   - Link viewing activity to lead_fdd_access
   - Create insights dashboard for franchisors

3. **Email Templates**
   - Lead invitation emails
   - Welcome emails
   - Disclosure reminder emails

4. **Domain Separation**
   - Configure for fddadvisor.com and fddhub.com
   - Update navigation based on domain
   - Separate branding/messaging

5. **Insights Module UI**
   - Competitive intelligence dashboard
   - Lead research timeline
   - Comparison alerts
   - Benchmarking data

## Next Steps

1. Build FDDAdvisor public discovery experience
2. Add competitive intelligence tracking
3. Create Insights module dashboard
4. Set up email templates
5. Configure domain separation
6. Test end-to-end user flows
