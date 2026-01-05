# Hub Routes

> FDDHub portal routes for franchisors and buyers

## Overview

The `/hub` routes serve the B2B SaaS portal where:
- **Franchisors** manage leads, send invitations, and view analytics
- **Buyers** view their assigned FDDs, give consent, and sign receipts

## Directory Structure

```
hub/
├── company-settings/       # Franchisor company profile
│   └── page.tsx
├── fdd/                    # FDD viewer (white-labeled)
│   └── [franchiseId]/
│       ├── page.tsx
│       ├── layout.tsx
│       └── loading.tsx
├── invite/                 # Invitation landing page
│   └── [token]/
│       ├── page.tsx
│       ├── layout.tsx
│       └── loading.tsx
├── leads/                  # Lead management (franchisor)
│   └── page.tsx
├── my-fdds/               # Buyer's FDD list
│   ├── page.tsx
│   ├── layout.tsx
│   └── loading.tsx
└── settings/              # Franchisor settings
    ├── page.tsx
    └── loading.tsx
```

## Route Details

### `/hub/my-fdds` (Buyer)
- Lists all FDDs the buyer has been invited to view
- Shows consent status, receipt status, and access dates
- Primary entry point for buyers after login

### `/hub/fdd/[franchiseId]` (Buyer)
- White-labeled FDD viewer
- Requires consent before viewing
- Tracks engagement (time spent, sections viewed)
- Includes AI chat assistant

### `/hub/leads` (Franchisor)
- Pipeline view of all leads
- Lead intelligence modal
- Send FDD invitations
- Import leads from CSV

### `/hub/invite/[token]` (Public)
- Landing page for invitation links
- Validates token and shows franchise info
- Redirects to signup or login

### `/hub/company-settings` (Franchisor)
- Company profile management
- White-label branding settings
- DocuSeal template configuration

### `/hub/settings` (Franchisor)
- User account settings
- Team member management
- Pipeline stage customization

## User Flow: Buyer Journey

```
1. Receive invitation email
   ↓
2. Click link → /hub/invite/[token]
   ↓
3. Signup/Login → /signup or /login
   ↓
4. Redirect → /hub/my-fdds
   ↓
5. Click "View FDD" → /hub/fdd/[franchiseId]
   ↓
6. Give consent → Consent modal
   ↓
7. Sign receipt → DocuSeal modal
   ↓
8. View FDD → Full access
```

## User Flow: Franchisor Journey

```
1. Login → /dashboard
   ↓
2. Navigate → /hub/leads
   ↓
3. Add lead → Manual or import
   ↓
4. Send invitation → Email sent
   ↓
5. Track engagement → Lead Intelligence
   ↓
6. Move through pipeline → Drag & drop
```

## Authentication

All `/hub` routes except `/hub/invite/[token]` require authentication.

The middleware (`middleware.ts`) handles redirects:
- Unauthenticated → `/login`
- No profile → `/onboarding`

## White-Labeling

The FDD viewer (`/hub/fdd/[franchiseId]`) supports:
- Custom primary color
- Custom logo
- Custom welcome message
- Franchisor branding

Settings stored in `white_label_settings` table.

## Related Documentation

- [Two Product Architecture](/docs/TWO_PRODUCT_ARCHITECTURE.md)
- [API Routes](../api/README.md)
- [Components](/components/README.md)
