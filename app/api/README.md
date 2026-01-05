# API Routes

> Next.js API routes for FDDHub and FDDAdvisor platforms

## Overview

All API routes use the Next.js App Router convention (`route.ts` files). Authentication is handled via Supabase, and most routes require an authenticated user.

## Directory Structure

```
api/
├── auth/                   # Authentication endpoints
├── buyer/                  # Buyer-specific endpoints
├── docuseal/              # DocuSeal integration (receipts)
├── engagement/            # Engagement tracking
├── fdd/                   # FDD operations
├── fdd-access/            # FDD access control
├── fdd-chat/              # AI chat endpoint
├── franchises/            # Franchise data
├── franchisor/            # Franchisor operations
├── hub/                   # FDDHub-specific endpoints
├── leads/                 # Lead management
├── notes/                 # User notes
├── team/                  # Team member management
├── admin/                 # Admin-only endpoints
├── debug/                 # Debug endpoints (dev only)
└── white-label-settings/  # Branding settings
```

## Key Endpoints

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/profile` | Get current user profile |

### Lead Management
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/leads` | List leads (filtered by role) |
| POST | `/api/leads` | Create new lead |
| POST | `/api/leads/send-fdd` | Send FDD invitation email |
| POST | `/api/leads/import` | Bulk import leads |
| GET | `/api/leads/engagement` | Get lead engagement data + AI analysis |

### Team Management
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/team` | List team members |
| POST | `/api/team` | Invite new team member |
| PATCH | `/api/team/[id]` | Update team member |
| DELETE | `/api/team/[id]` | Remove team member |
| POST | `/api/team/[id]/resend` | Resend invitation |
| POST | `/api/team/accept` | Accept team invitation |

### FDD Operations
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/fdd-chat` | AI chat with FDD context |
| GET | `/api/fdd/[fdd_id]/search` | Semantic search in FDD |
| GET | `/api/fdd/item-mappings` | Get Item page mappings |
| POST | `/api/fdd/engagement` | Track FDD engagement |

### FDD Access & Consent
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/fdd-access/consent` | Record buyer consent |
| POST | `/api/fdd-access/sign-item23` | Sign Item 23 receipt |
| GET | `/api/hub/fdd-access` | Get buyer's FDD access list |

### DocuSeal Integration
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/docuseal/create-submission` | Create signing session |
| POST | `/api/docuseal/webhook` | Handle completion webhook |
| POST | `/api/docuseal/complete-receipt` | Mark receipt complete |

### Hub Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/hub/leads` | Get franchisor's leads |
| POST | `/api/hub/invitations` | Create lead invitation |
| GET | `/api/hub/invite/[token]` | Validate invitation token |
| POST | `/api/hub/assistant` | Sales assistant AI |

### Franchises
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/franchises` | List franchises |
| GET | `/api/franchises/public` | Public franchise list |

### White Label
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/white-label-settings/[franchiseId]` | Get branding settings |

## Authentication Pattern

All protected routes follow this pattern:

```typescript
import { getSupabaseRouteClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await getSupabaseRouteClient()
  
  // Get authenticated user
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Continue with authorized request...
}
```

## Service Role Pattern

For admin operations that bypass RLS:

```typescript
import { getSupabaseServiceClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = getSupabaseServiceClient()
  // This client bypasses RLS - use carefully!
}
```

## Error Response Format

All endpoints return consistent error responses:

```json
{
  "error": "Error message here"
}
```

With appropriate HTTP status codes:
- `400` - Bad request / validation error
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (wrong role/permissions)
- `404` - Resource not found
- `409` - Conflict (duplicate)
- `500` - Internal server error

## Rate Limiting

Currently no rate limiting implemented. Consider adding for:
- `/api/fdd-chat` (AI calls)
- `/api/leads/send-fdd` (email sends)
- `/api/docuseal/*` (external API)

## Related Documentation

- [Database Schema](/docs/DATABASE-SCHEMA.md)
- [Architecture](/docs/FINAL_ARCHITECTURE.md)
- [Team Member Implementation](/docs/TEAM_MEMBER_IMPLEMENTATION.md)
