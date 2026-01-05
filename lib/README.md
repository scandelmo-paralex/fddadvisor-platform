# Lib Directory

> Shared utilities, types, and service integrations

## Overview

This directory contains shared code used across the application including database clients, utility functions, type definitions, and service integrations.

## Directory Structure

```
lib/
├── supabase/              # Supabase client configurations
│   ├── client.ts          # Browser client
│   ├── server.tsx         # Server-side clients
│   └── service-role.ts    # Admin client (bypasses RLS)
├── types/                 # TypeScript type definitions
│   └── database.ts        # Database types
├── api-client.ts          # Frontend API helpers
├── data.ts                # Static data and types
├── email.tsx              # Resend email functions
├── fdd-content.ts         # FDD content utilities
├── polyfills.ts           # Browser polyfills
├── polyfill-script.ts     # Safari compatibility
├── sentry.ts              # Error tracking config
├── tracking.ts            # Analytics tracking
├── utils.ts               # General utilities (cn, etc.)
└── verification-utils.ts  # User verification helpers
```

## Supabase Clients

### Browser Client (`supabase/client.ts`)
For client components:
```typescript
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()
```

### Server Client (`supabase/server.tsx`)
For server components and API routes:
```typescript
import { createServerClient, getSupabaseRouteClient } from "@/lib/supabase/server"

// In Server Components
const supabase = await createServerClient()

// In API Routes
const supabase = await getSupabaseRouteClient()
```

### Service Role Client (`supabase/service-role.ts`)
For admin operations (bypasses RLS):
```typescript
import { getSupabaseServiceClient } from "@/lib/supabase/server"

const supabase = getSupabaseServiceClient()
// WARNING: This bypasses all RLS policies!
```

## Key Utilities

### `utils.ts`
```typescript
import { cn } from "@/lib/utils"

// Conditional class names
<div className={cn("base", condition && "conditional")} />
```

### `email.tsx`
Email sending via Resend:
```typescript
import { sendInvitationEmail, sendTeamInvitationEmail } from "@/lib/email"

await sendInvitationEmail({
  to: "buyer@example.com",
  leadName: "John Doe",
  franchiseName: "Drybar",
  invitationLink: "https://...",
  franchisorName: "WellBiz",
})
```

### `tracking.ts`
Engagement tracking:
```typescript
import { trackEngagement } from "@/lib/tracking"

await trackEngagement({
  buyerId: "...",
  franchiseId: "...",
  action: "page_view",
  metadata: { page: 5 }
})
```

## Type Definitions

### `types/database.ts`
Database types matching Supabase schema:
```typescript
export type TeamMemberRole = "owner" | "admin" | "recruiter" | "viewer"

export interface WhiteLabelSettings {
  id: string
  franchise_id: string
  primary_color: string
  logo_url: string | null
  welcome_message: string | null
  // ...
}

export interface PipelineStage {
  id: string
  franchisor_id: string
  name: string
  color: string
  position: number
  // ...
}
```

### `data.ts`
Static data and mock types:
```typescript
export interface Franchise {
  id: string
  name: string
  franchiseScore: number
  // ...
}

export interface Lead {
  id: string
  name: string
  email: string
  stage: string
  // ...
}
```

## Environment Variables

Required variables (see `.env.example`):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Email
RESEND_API_KEY=

# AI
GOOGLE_API_KEY=
ANTHROPIC_API_KEY=

# DocuSeal
DOCUSEAL_API_KEY=

# Monitoring
SENTRY_DSN=
```

## Browser Compatibility

### `polyfills.ts` / `polyfill-script.ts`
Safari compatibility fixes:
- `Promise.withResolvers` polyfill
- `structuredClone` polyfill
- Runs before React hydration

## Error Tracking

### `sentry.ts`
Sentry configuration for error monitoring:
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.captureException(error)
Sentry.captureMessage("Something happened")
```

## Best Practices

1. **Use appropriate Supabase client**
   - Browser → `client.ts`
   - Server/API → `server.tsx`
   - Admin → `service-role.ts` (careful!)

2. **Type everything**
   - Define types in `types/database.ts`
   - Use TypeScript strict mode

3. **Handle errors**
   - Log to console with `[v0]` prefix
   - Report to Sentry in production

4. **Environment variables**
   - `NEXT_PUBLIC_*` for browser-accessible
   - Others only available server-side

## Related Documentation

- [Database Schema](/docs/DATABASE-SCHEMA.md)
- [API Routes](/app/api/README.md)
- [Architecture](/docs/FINAL_ARCHITECTURE.md)
