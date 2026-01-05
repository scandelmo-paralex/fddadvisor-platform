# App Directory

> Next.js 15 App Router structure for FDDHub and FDDAdvisor platforms

## Overview

This directory contains all pages, API routes, and server components using the Next.js App Router pattern.

## Directory Structure

```
app/
├── api/                    # API routes (see api/README.md)
├── hub/                    # FDDHub (franchisor/buyer portal)
├── admin/                  # Admin tools (internal use)
├── legal/                  # Legal pages (Terms, Privacy)
├── auth/                   # Auth callback handlers
├── actions/                # Server actions
├── layout.tsx              # Root layout
├── page.tsx                # Homepage
└── globals.css             # Global styles
```

## Key Routes

### Public Routes
| Route | File | Description |
|-------|------|-------------|
| `/` | `page.tsx` | Homepage/landing |
| `/login` | `login/page.tsx` | Login page |
| `/signup` | `signup/page.tsx` | Buyer signup (from invitation) |
| `/discover` | `discover/page.tsx` | Franchise discovery tool |
| `/fdd/[slug]` | `fdd/[slug]/page.tsx` | FDD viewer (public) |
| `/legal/terms` | `legal/terms/page.tsx` | Terms of Service |
| `/legal/privacy` | `legal/privacy/page.tsx` | Privacy Policy |

### Protected Routes (Authentication Required)
| Route | File | Description |
|-------|------|-------------|
| `/dashboard` | `dashboard/page.tsx` | Main dashboard |
| `/profile` | `profile/page.tsx` | User profile |
| `/hub/my-fdds` | `hub/my-fdds/page.tsx` | Buyer's FDD list |
| `/hub/leads` | `hub/leads/page.tsx` | Franchisor lead management |
| `/hub/settings` | `hub/settings/page.tsx` | Franchisor settings |
| `/hub/company-settings` | `hub/company-settings/page.tsx` | Company profile |

### Special Routes
| Route | File | Description |
|-------|------|-------------|
| `/hub/invite/[token]` | `hub/invite/[token]/page.tsx` | Lead invitation landing |
| `/team-signup` | `team-signup/page.tsx` | Team member signup |
| `/reset-password` | `reset-password/page.tsx` | Password reset |
| `/auth/callback` | `auth/callback/route.ts` | Supabase auth callback |

## Authentication Flow

1. **Middleware** (`middleware.ts`) checks auth on protected routes
2. **Login** redirects based on user role:
   - Buyers → `/hub/my-fdds`
   - Franchisors → `/dashboard`
3. **Magic links** for invitations bypass normal login

## Server vs Client Components

- **Server Components** (default): Pages that fetch data
- **Client Components** (`"use client"`): Interactive UI components
- **Server Actions** (`app/actions/`): Form submissions, mutations

## Layout Hierarchy

```
layout.tsx (root)
├── NotificationProvider
├── AppWrapper (theme, context)
└── Analytics, SpeedInsights
```

## Environment Variables Used

```bash
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anonymous key
```

## Related Documentation

- [API Routes](./api/README.md)
- [Hub Routes](./hub/README.md)
- [Architecture](/docs/FINAL_ARCHITECTURE.md)
