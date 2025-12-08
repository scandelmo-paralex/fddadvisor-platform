# FDDAdvisor + FDDHub Architecture Recommendation

## Executive Summary

**Recommendation: Monorepo with strict runtime separation via middleware and environment variables.**

Keep one unified codebase but separate the products through routing, access control, and conditional features. This approach maximizes code reuse while maintaining clear product boundaries.

**Deployment Strategy**: Two separate Vercel projects deploying from the same GitHub repository.

**Key Principle**: Maintain complete platform independence (separate domains, deployments, billing) while maximizing code reuse through shared components and utilities.

---

## Product Definitions

### FDDAdvisor (Free Discovery Platform)
- **Purpose**: Buyer research tool + competitive intelligence data collection
- **Access**: Public (no auth required)
- **Features**:
  - Browse 400+ franchise profiles
  - View FDD analyses and data
  - Search and filter franchises
  - Compare franchises
  - AI chat with FDDs
- **Restrictions**:
  - NO "Connect with Franchisor" buttons
  - NO "Connect with Lender" buttons
  - NO lead generation (for now)
- **Monetization**: Data/insights resold to franchisors

### FDDHub (Franchisor SaaS Platform)
- **Purpose**: Franchisor tool to share FDDs with their leads
- **Access**: Invitation-only (auth required)
- **User Types**:
  1. **Franchisors**: Upload FDDs, manage leads, view intelligence
  2. **Leads**: View FDDs sent to them by franchisors
- **Features**:
  - Franchisor Dashboard (existing)
  - Lead invitation system (new)
  - Lead Dashboard (new) - shows all FDDs received
  - White-labeled FDD Viewer (new)
  - Lead intelligence reports (existing)
  - Insights module (paid add-on)
- **Monetization**: SaaS subscription + insights add-on

---

## Architecture Options Analysis

### Option 1: Monorepo with Separate Apps ⭐⭐⭐
\`\`\`
/apps
  /fdd-advisor (Next.js app)
  /fdd-hub (Next.js app)
/packages
  /ui (shared components)
  /database (shared schemas)
\`\`\`

**Pros:**
- Clean separation of concerns
- Independent deployments
- Different domains (fddadvisor.com, fddhub.com)

**Cons:**
- More complex setup (Turborepo/Nx)
- Component duplication or complex sharing
- Two separate deployments to manage

**Verdict:** Good for larger teams, overkill for current stage

---

### Option 2: Separate Repositories ⭐⭐
\`\`\`
/fdd-advisor (separate repo)
/fdd-hub (separate repo)
\`\`\`

**Pros:**
- Complete independence
- Different tech stacks possible
- Easier access control per repo

**Cons:**
- Significant code duplication (FDD Viewer, data structures, etc.)
- Harder to keep features in sync
- Double the maintenance burden
- Shared database becomes complex

**Verdict:** Too much duplication, not recommended

---

### Option 3: Single App with Multi-Tenancy ⭐⭐⭐⭐⭐ **RECOMMENDED**
\`\`\`
/app
  /(advisor)          # FDDAdvisor routes
  /(hub)              # FDDHub routes
/components
  /advisor            # Advisor-specific
  /hub                # Hub-specific
  /shared             # Shared components
\`\`\`

**Pros:**
- Maximum code reuse (FDD Viewer, AI chat, data structures)
- Single deployment and database
- Easy to share features between products
- Simpler to maintain
- Can use route groups for organization

**Cons:**
- Need careful access control
- Conditional logic in shared components

**Verdict:** Best balance of separation and efficiency

---

## Recommended Implementation Plan

### Phase 1: Route Structure & Access Control

**New Route Organization:**
\`\`\`
/                           → FDDAdvisor homepage
/browse                     → FDDAdvisor franchise browser
/franchise/[slug]           → FDDAdvisor franchise profile (read-only)
/fdd/[id]                   → FDDAdvisor FDD viewer (no connect buttons)
/compare                    → FDDAdvisor comparison tool

/hub                        → FDDHub landing/login
/hub/dashboard              → Franchisor dashboard (existing)
/hub/leads                  → Lead management (new)
/hub/insights               → Insights module (paid add-on)

/hub/lead/dashboard         → Lead's personal dashboard (new)
/hub/lead/fdd/[id]          → White-labeled FDD viewer for leads (new)

/auth/login                 → Shared auth (different redirects)
/auth/signup                → Shared auth
\`\`\`

**Access Control:**
- FDDAdvisor routes: Public (no auth)
- `/hub/*` routes: Auth required
- `/hub/dashboard`: Franchisor role only
- `/hub/lead/*`: Lead role only

---

### Phase 2: Database Schema Changes

**New Tables:**

\`\`\`sql
-- Lead invitations from franchisors
CREATE TABLE lead_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchisor_id UUID REFERENCES franchisors(id),
  franchise_id UUID REFERENCES franchises(id),
  lead_email TEXT NOT NULL,
  lead_name TEXT,
  lead_phone TEXT,
  fdd_id UUID REFERENCES fdds(id),
  status TEXT DEFAULT 'pending', -- pending, accepted, viewed
  invited_at TIMESTAMP DEFAULT NOW(),
  viewed_at TIMESTAMP,
  white_label_settings JSONB -- custom branding per invitation
);

-- Track which FDDs a lead has access to
CREATE TABLE lead_fdd_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_user_id UUID REFERENCES users(id),
  fdd_id UUID REFERENCES fdds(id),
  franchise_id UUID REFERENCES franchises(id),
  franchisor_id UUID REFERENCES franchisors(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  last_viewed_at TIMESTAMP,
  view_count INTEGER DEFAULT 0
);

-- White label settings per franchise
CREATE TABLE white_label_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  franchise_id UUID REFERENCES franchises(id),
  franchisor_id UUID REFERENCES franchisors(id),
  logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  custom_message TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT
);
\`\`\`

**Modified Tables:**

\`\`\`sql
-- Add user_type to distinguish users
ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT 'lead';
-- Values: 'advisor_user', 'lead', 'franchisor'

-- Add source tracking to users
ALTER TABLE users ADD COLUMN source TEXT DEFAULT 'hub';
-- Values: 'advisor', 'hub'
\`\`\`

---

### Phase 3: Component Modifications

**1. FDD Viewer Component**

Add "mode" prop to control behavior:

\`\`\`typescript
interface FDDViewerProps {
  franchise: Franchise
  mode: 'advisor' | 'hub-lead' | 'hub-franchisor'
  whiteLabelSettings?: WhiteLabelSettings
}
\`\`\`

**Changes:**
- `mode='advisor'`: Remove all "Connect" buttons, show FDDAdvisor branding
- `mode='hub-lead'`: Show white-label branding, add franchisor contact info
- `mode='hub-franchisor'`: Full features (existing behavior)

**2. Navigation/Header**

Create context-aware header:
- FDDAdvisor: "FDDAdvisor" logo, browse/search/compare links
- FDDHub: "FDDHub" logo, dashboard/leads/insights links

**3. Dashboard Components**

- Keep existing franchisor dashboard
- Create new lead dashboard showing received FDDs
- Add lead invitation UI to franchisor dashboard

---

### Phase 4: New Features to Build

**For Franchisors (in FDDHub):**

1. **Lead Invitation System**
   - Add lead manually (name, email, phone)
   - Select which FDD to send
   - Customize white-label settings (logo, colors, message)
   - Send invitation email with magic link
   - Track invitation status (sent, viewed, etc.)

2. **Lead Management Dashboard**
   - List of all leads
   - Which FDDs each lead has viewed
   - View analytics per lead
   - Resend invitations

**For Leads (in FDDHub):**

1. **Lead Dashboard**
   - Shows all FDDs received from various franchisors
   - Card-based layout with franchise logos
   - Status indicators (new, viewed, etc.)
   - Quick access to each FDD

2. **White-Labeled FDD Viewer**
   - Custom branding per franchise
   - Franchisor contact info prominently displayed
   - "Contact [Franchise Name]" button
   - Progress tracking visible to franchisor

**For FDDAdvisor:**

1. **Remove Connection Features**
   - Remove "Connect with Franchisor" buttons
   - Remove "Connect with Lender" buttons
   - Keep all research/analysis features

2. **Optional: Anonymous Analytics**
   - Track which franchises are viewed most
   - Track search patterns
   - Aggregate data for insights product

---

### Phase 5: Deployment Strategy

**Single Deployment, Multiple Domains:**

1. **Primary Domain**: `fddhub.com`
   - Serves both products
   - `/` → FDDAdvisor
   - `/hub/*` → FDDHub

2. **Optional Subdomain**: `advisor.fddhub.com`
   - Points to same deployment
   - Middleware redirects to `/` routes

**Environment Variables:**
\`\`\`
NEXT_PUBLIC_PRODUCT_MODE=multi  # or 'advisor-only', 'hub-only'
NEXT_PUBLIC_ADVISOR_DOMAIN=advisor.fddhub.com
NEXT_PUBLIC_HUB_DOMAIN=fddhub.com
\`\`\`

**Two Vercel Projects, One Repository**

**Project 1: fddadvisor-prod**
\`\`\`
Domain: fddadvisor.com
Environment Variables:
  - NEXT_PUBLIC_PLATFORM=fddadvisor
  - NEXT_PUBLIC_APP_URL=https://fddadvisor.com
  - SUPABASE_URL=<shared>
  - SUPABASE_ANON_KEY=<shared>
  - NO STRIPE_SECRET_KEY (no billing)
  - NO RESEND_API_KEY (no emails)
Build Command: next build
Root Directory: /
\`\`\`

**Project 2: fddhub-prod**
\`\`\`
Domain: fddhub.com
Environment Variables:
  - NEXT_PUBLIC_PLATFORM=fddhub
  - NEXT_PUBLIC_APP_URL=https://fddhub.com
  - SUPABASE_URL=<shared>
  - SUPABASE_ANON_KEY=<shared>
  - STRIPE_SECRET_KEY=<fddhub only>
  - RESEND_API_KEY=<fddhub only>
Build Command: next build
Root Directory: /
\`\`\`

**Middleware-Based Separation**

\`\`\`typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const platform = process.env.NEXT_PUBLIC_PLATFORM
  const { pathname } = request.nextUrl

  // FDDAdvisor deployment: Block /hub/* routes
  if (platform === 'fddadvisor' && pathname.startsWith('/hub')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // FDDHub deployment: Block public routes, redirect to /dashboard
  if (platform === 'fddhub' && !pathname.startsWith('/hub')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Auth checks...
  return NextResponse.next()
}
\`\`\`

---

## Proposed Structure

\`\`\`
/app/
  /(public)/              # FDDAdvisor routes (fddadvisor.com)
    /page.tsx             # Homepage with browse/search
    /discover/page.tsx    # AI Discovery Assistant
    /franchise/[slug]/page.tsx
    /compare/page.tsx
    /fdd/[id]/page.tsx    # Requires auth
    /login/page.tsx
    /signup/page.tsx      # With demographics
  
  /(hub)/                 # FDDHub routes (fddhub.com)
    /dashboard/page.tsx   # Franchisor dashboard
    /leads/page.tsx
    /settings/page.tsx
    /my-fdds/page.tsx     # Lead dashboard
    /fdd/[id]/page.tsx    # White-labeled viewer
    /invite/[token]/page.tsx
  
  /api/
    /public/              # FDDAdvisor APIs (no auth required)
      /franchises/route.ts
      /chat/route.ts
    /hub/                 # FDDHub APIs (auth required)
      /invitations/route.ts
      /leads/route.ts
    /shared/              # Shared APIs (used by both)
      /fdd/[id]/route.ts

/components/
  /fddadvisor/            # FDDAdvisor-specific components
    /public-homepage.tsx
    /discovery-tool.tsx
  /fddhub/                # FDDHub-specific components
    /franchisor-dashboard.tsx
    /lead-dashboard.tsx
  /shared/                # Shared components
    /fdd-viewer.tsx       # Used by both platforms
    /ui/                  # shadcn components

/lib/
  /supabase/              # Shared Supabase clients
  /types/                 # Shared TypeScript types
  /utils/                 # Shared utilities
  /email.tsx              # Email templates (FDDHub only)

/middleware.ts            # Platform-aware routing and auth
\`\`\`

---

## Key Implementation Principles

### 1. Shared Components with Platform-Aware Behavior

\`\`\`typescript
// components/shared/fdd-viewer.tsx
interface FDDViewerProps {
  fddId: string
  mode?: 'public' | 'white-label'
  whiteLabelSettings?: WhiteLabelSettings
}

export function FDDViewer({ fddId, mode = 'public', whiteLabelSettings }: FDDViewerProps) {
  const platform = process.env.NEXT_PUBLIC_PLATFORM
  
  // FDDAdvisor: Always public mode, no connect buttons
  // FDDHub: White-label mode with custom branding
  const viewerMode = platform === 'fddadvisor' ? 'public' : mode
  
  return (
    <div className={viewerMode === 'white-label' ? 'white-label-theme' : 'public-theme'}>
      {/* FDD content */}
      {platform === 'fddhub' && <ContactFranchisorButton />}
    </div>
  )
}
\`\`\`

### 2. Database Access via RLS Policies

\`\`\`sql
-- FDDAdvisor: Read-only access to public franchise data
CREATE POLICY "Public franchises viewable by all"
ON franchises FOR SELECT
USING (is_public = true);

-- FDDHub: Franchisors see only their data
CREATE POLICY "Franchisors see only their leads"
ON lead_invitations FOR SELECT
USING (
  franchisor_id IN (
    SELECT id FROM franchisor_profiles 
    WHERE user_id = auth.uid()
  )
);

-- FDDHub: Leads see only invited FDDs
CREATE POLICY "Leads access only invited FDDs"
ON lead_fdd_access FOR SELECT
USING (buyer_id = auth.uid());

-- Cross-platform tracking: Only for invited leads
CREATE POLICY "Track FDDAdvisor activity for invited leads"
ON cross_platform_activities FOR INSERT
USING (
  prospect_id IN (
    SELECT buyer_id FROM lead_fdd_access
    WHERE buyer_id = auth.uid()
  )
);
\`\`\`

### 3. API Route Separation

\`\`\`typescript
// app/api/public/franchises/route.ts (FDDAdvisor)
export async function GET() {
  // No auth required
  // Returns public franchise data only
  // NO franchisor contact info
  // NO proprietary data
}

// app/api/hub/invitations/route.ts (FDDHub)
export async function POST(request: Request) {
  // Auth required
  // Franchisor-only access
  // Creates invitation and sends email
  // Requires RESEND_API_KEY (only in FDDHub)
}
\`\`\`

### 4. Cross-Platform Account Linking

\`\`\`typescript
// When a lead signs up via FDDHub invitation
// Check if email matches existing FDDAdvisor account
const existingBuyer = await supabase
  .from('buyer_profiles')
  .select('id')
  .eq('email', leadEmail)
  .eq('signup_source', 'fddadvisor')
  .single()

if (existingBuyer) {
  // Link accounts
  await supabase
    .from('fddhub_prospect_users')
    .update({ fddadvisor_user_id: existingBuyer.id })
    .eq('email', leadEmail)
  
  // Enable cross-platform tracking for THIS franchise only
  await enableCompetitiveIntelligence(existingBuyer.id, franchiseId)
}
\`\`\`

---

## Benefits of This Approach

### 1. **Maintains Complete Independence**
- ✅ Two separate domains (fddadvisor.com, fddhub.com)
- ✅ Two separate Vercel deployments
- ✅ FDDAdvisor has NO billing code (Stripe not installed)
- ✅ FDDHub has NO public browse functionality
- ✅ Clear separation in user experience
- ✅ FDDAdvisor remains 100% free and unmonetized

### 2. **Maximizes Code Reuse**
- ✅ Shared UI components (70% of codebase)
- ✅ Shared database types and utilities
- ✅ Shared FDD Viewer with platform-aware rendering
- ✅ Single source of truth for business logic
- ✅ Shared authentication logic

### 3. **Easier Maintenance**
- ✅ Bug fixes apply to both platforms
- ✅ Security updates happen once
- ✅ Type safety across both platforms
- ✅ Single CI/CD pipeline
- ✅ Unified testing strategy

### 4. **Faster Development**
- ✅ No code duplication
- ✅ Shared component library
- ✅ Single dependency management
- ✅ Faster feature development

### 5. **Scalability**
- ✅ Can add more platforms (e.g., lender portal) easily
- ✅ Shared infrastructure scales together
- ✅ Database optimizations benefit both platforms
- ✅ Easy to extract into separate repos later if needed

---

## Why NOT Separate Projects?

### Challenges with Separate Repositories:

**1. Massive Code Duplication**
- FDD Viewer component (~2000 lines) duplicated
- All UI components duplicated
- Database types duplicated
- API utilities duplicated
- Authentication logic duplicated

**2. Maintenance Nightmare**
- Bug fix in FDD Viewer? Update in 2 places
- Security patch? Apply to 2 repos
- Database schema change? Update types in 2 places
- New feature? Implement twice

**3. Version Drift**
- FDDAdvisor on React 19, FDDHub on React 18?
- Different versions of Supabase client?
- Inconsistent UI components?
- API contracts out of sync?

**4. Development Slowdown**
- Every feature takes 2x longer
- Testing requires 2 separate test suites
- CI/CD pipelines for 2 repos
- More complex deployment coordination

**5. Higher Costs**
- Two separate Vercel projects (could be same cost)
- Two sets of dependencies to manage
- More developer time for maintenance

---

## Migration Path from Current State

### Phase 1: Reorganize Routes (Week 1)
1. Create route groups: `/(public)/` and `/(hub)/`
2. Move existing routes into appropriate groups
3. Update imports and references
4. Test that all routes still work

### Phase 2: Add Platform Detection (Week 1)
1. Add `NEXT_PUBLIC_PLATFORM` environment variable
2. Update middleware to enforce platform separation
3. Add platform-aware component rendering
4. Test both platforms locally

### Phase 3: Separate Deployments (Week 2)
1. Create two Vercel projects from same repo
2. Configure environment variables per platform
3. Set up custom domains (fddadvisor.com, fddhub.com)
4. Test both deployments in production

### Phase 4: Remove Cross-Platform Features (Week 2)
1. Remove "Connect" buttons from FDDAdvisor
2. Remove browse functionality from FDDHub
3. Add auth gates to FDDAdvisor FDD Viewer
4. Implement white-label rendering in FDDHub
5. Test user flows on both platforms

### Phase 5: Competitive Intelligence (Week 3-4)
1. Track FDDAdvisor activity for invited leads
2. Build Insights dashboard in FDDHub
3. Add cross-platform alerts
4. Implement paywall for Insights module
5. Test end-to-end intelligence flow

---

## Addressing Your Specific Requirements

### ✅ FDDAdvisor Must Be:
- **100% free**: No Stripe integration in fddadvisor deployment
- **Independent**: No franchisor data visible, no financial ties
- **Public-first**: Browse without account (middleware allows public access)
- **Privacy-focused**: Anonymous research (no tracking unless user has account)

### ✅ FDDHub Must Be:
- **Paid/authenticated**: Requires franchisor subscription (Stripe in fddhub deployment)
- **Gated**: Prospects only access via invitation (middleware enforces auth)
- **Transactional**: Track all interactions (lead_activities table)
- **Permission-based**: Clear disclosure in invitation email

### ✅ Data Architecture:
- **Public Schema**: FDDAdvisor reads (franchises, fdds, fdd_chunks)
- **Private Schema**: FDDHub only (franchisors, leads, activities)
- **RLS Policies**: Enforce separation at database level
- **Cross-platform linking**: When emails match, enable intelligence

### ✅ Critical Business Rules:
- ✅ Track cross-platform activity when prospect has FDDHub access
- ✅ Link accounts when emails match
- ✅ Show franchisors when prospects compare on FDDAdvisor
- ✅ Require authentication on FDDHub
- ✅ Allow anonymous browsing on FDDAdvisor
- ❌ Don't monetize FDDAdvisor
- ❌ Don't track anonymous browsing
- ❌ Don't show franchisor data on FDDAdvisor
- ❌ Don't allow FDDHub access without invitation
- ❌ Don't mix billing

---

## Alternative: Separate Projects (Not Recommended)

If you still want completely separate projects:

\`\`\`
/fddadvisor/              # Separate Next.js project
  /app/
  /components/
  /lib/
  package.json

/fddhub/                  # Separate Next.js project
  /app/
  /components/
  /lib/
  package.json

/shared/                  # npm package
  /components/
  /types/
  /utils/
  package.json
\`\`\`

**Challenges:**
- Need to publish shared package to npm or use workspace
- Changes require updates in multiple places
- More complex CI/CD setup
- Higher maintenance burden
- Risk of version drift
- Estimated 2-3x longer development time

---

## Cost & Complexity Comparison

| Approach | Setup Time | Dev Time | Maintenance | Code Reuse | Independence |
|----------|-----------|----------|-------------|------------|--------------|
| **Monorepo** | **2 weeks** | **1x** | **Low** | **High** | **High** |
| Separate Projects | 4 weeks | 2-3x | High | Low | High |
| Turborepo | 3 weeks | 1.5x | Medium | High | High |

**Monorepo wins on:**
- ✅ Fastest to implement (2 weeks vs 4 weeks)
- ✅ Easiest to maintain (single codebase)
- ✅ Maximum code reuse (70%+ shared)
- ✅ Still achieves complete independence (separate deployments)

---

## Recommendation Summary

**Go with Monorepo + Strict Runtime Separation** ⭐⭐⭐⭐⭐

This approach gives you:
- ✅ Complete platform independence (separate domains, deployments)
- ✅ Maximum code reuse (shared components, types, utilities)
- ✅ Easier maintenance (single codebase, unified testing)
- ✅ Faster development (no duplication, single source of truth)
- ✅ Clear separation (middleware enforces platform boundaries)
- ✅ Scalability (easy to add more platforms)
- ✅ Lower costs (single codebase to maintain)
- ✅ Type safety (shared types ensure consistency)

**The key insight**: Use **environment variables** and **middleware** to enforce separation at runtime, while keeping the codebase unified for development efficiency.

---

## Next Steps

1. ✅ Review this recommendation
2. ⏳ Decide on monorepo vs separate projects
3. ⏳ If monorepo: Start Phase 1 (reorganize routes)
4. ⏳ If separate: Set up workspace structure
5. ⏳ Create detailed implementation plan
6. ⏳ Begin migration

**Estimated Timeline**: 3-4 weeks for full implementation

Let me know which approach you'd like to proceed with, and I can help implement it step by step.
