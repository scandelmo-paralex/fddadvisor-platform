# Sentry Usage Guide for FDDHub

This guide provides best practices for using Sentry in the FDDHub project.

## Configuration Files

- **Client-side**: `instrumentation-client.ts`
- **Server-side**: `sentry.server.config.ts`
- **Edge runtime**: `sentry.edge.config.ts`
- **Utility library**: `lib/sentry.ts` (enhanced error capture with FDDHub context)

Initialization only happens in the config files. In other files, import the utilities:

\`\`\`typescript
// Preferred: Use FDDHub's enhanced utilities
import { 
  captureException, 
  captureApiException,
  captureComponentException,
  setSentryUser,
  addBreadcrumb,
  extractUserContext 
} from "@/lib/sentry"

// Or for raw Sentry access
import * as Sentry from "@sentry/nextjs"
\`\`\`

## Exception Catching

Use `Sentry.captureException(error)` to capture exceptions in try-catch blocks:

\`\`\`typescript
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error)
  // Handle error gracefully
}
\`\`\`

## Enhanced Exception Capture (Recommended)

Use the `lib/sentry.ts` utilities for automatic context enrichment:

### Basic Exception Capture

\`\`\`typescript
import { captureException } from "@/lib/sentry"

try {
  await riskyOperation()
} catch (error) {
  captureException(error, {
    user: { id: userId, email: userEmail, role: 'buyer' },
    page: '/hub/fdd/drybar',
    franchiseId: 'abc123',
    fddId: 'fdd456',
    extra: {
      attemptedAction: 'load_pdf',
      pageNumber: 5
    }
  })
}
\`\`\`

### API Route Exception Capture

\`\`\`typescript
import { captureApiException } from "@/lib/sentry"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    // ... process request
  } catch (error) {
    captureApiException(error, request, {
      user: { id: user.id, email: user.email, role: userData.role },
      franchiseId: body.franchise_id,
      action: 'create_lead',
      extra: { requestBody: body }
    })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
\`\`\`

### Component Exception Capture

\`\`\`typescript
import { captureComponentException } from "@/lib/sentry"

function MyComponent() {
  const handleError = (error: Error) => {
    captureComponentException(error, 'MyComponent', {
      user: { id: userId, email, role },
      franchiseId,
      extra: { componentState: state }
    })
  }
}
\`\`\`

## Setting User Context

Set user context once when the user logs in. This attaches user info to ALL subsequent Sentry events:

\`\`\`typescript
import { setSentryUser, extractUserContext } from "@/lib/sentry"

// After successful authentication
const { data: { user } } = await supabase.auth.getUser()
const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

setSentryUser(extractUserContext(user, userData))

// On logout, clear the user
setSentryUser(null)
\`\`\`

## Available Context Options

The `captureException()` function accepts these FDDHub-specific options:

| Option | Type | Description |
|--------|------|-------------|
| `user` | `{ id?, email?, role? }` | User information |
| `franchiseId` | `string` | Franchise ID |
| `fddId` | `string` | FDD document ID |
| `leadId` | `string` | Lead ID |
| `engagementId` | `string` | Engagement session ID |
| `page` | `string` | Current page/route |
| `action` | `string` | Action being performed |
| `component` | `string` | React component name |
| `apiEndpoint` | `string` | API endpoint path |
| `tags` | `Record<string, string>` | Custom tags for filtering |
| `extra` | `Record<string, unknown>` | Additional context data |

## Tracing / Spans

Create spans for meaningful actions like button clicks, API calls, and function calls.

### UI Interactions

\`\`\`typescript
function MyComponent() {
  const handleButtonClick = () => {
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Submit Form Button",
      },
      (span) => {
        span.setAttribute("formType", "contact")
        span.setAttribute("fieldCount", 5)
        
        submitForm()
      }
    )
  }

  return <button onClick={handleButtonClick}>Submit</button>
}
\`\`\`

### API Calls

\`\`\`typescript
async function fetchFranchiseData(slug: string) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/franchises/${slug}`,
    },
    async (span) => {
      span.setAttribute("franchise.slug", slug)
      
      const response = await fetch(`/api/franchises/${slug}`)
      const data = await response.json()
      
      span.setAttribute("response.status", response.status)
      return data
    }
  )
}
\`\`\`

### Server Actions

\`\`\`typescript
async function processDocument(documentId: string) {
  return Sentry.startSpan(
    {
      op: "task",
      name: "Process FDD Document",
    },
    async (span) => {
      span.setAttribute("document.id", documentId)
      
      // Processing logic
      const result = await analyzeDocument(documentId)
      
      span.setAttribute("pages.processed", result.pageCount)
      return result
    }
  )
}
\`\`\`

## Structured Logging

Use Sentry's logger for structured logs that appear in your Sentry dashboard.

\`\`\`typescript
import * as Sentry from "@sentry/nextjs"

const { logger } = Sentry

// Log levels from least to most severe
logger.trace("Starting database connection", { database: "users" })
logger.debug(logger.fmt`Cache miss for user: ${userId}`)
logger.info("User logged in", { userId: 123, method: "email" })
logger.warn("Rate limit approaching", { endpoint: "/api/chat", remaining: 5 })
logger.error("Failed to process payment", { orderId: "order_123", amount: 99.99 })
logger.fatal("Database connection pool exhausted", { activeConnections: 100 })
\`\`\`

### Using `logger.fmt` for Variables

Use `logger.fmt` template literal function to include variables in structured logs:

\`\`\`typescript
const userId = "user_123"
const action = "view_fdd"

logger.info(logger.fmt`User ${userId} performed ${action}`)
\`\`\`

## FDDHub-Specific Examples

### Tracking FDD Views

\`\`\`typescript
function trackFDDView(franchiseSlug: string, pageNumber: number) {
  Sentry.startSpan(
    {
      op: "fdd.view",
      name: `View FDD: ${franchiseSlug}`,
    },
    (span) => {
      span.setAttribute("franchise.slug", franchiseSlug)
      span.setAttribute("page.number", pageNumber)
    }
  )
}
\`\`\`

### Tracking AI Chat Interactions

\`\`\`typescript
async function trackChatQuery(query: string, franchiseSlug: string) {
  return Sentry.startSpan(
    {
      op: "ai.chat",
      name: "FDD Chat Query",
    },
    async (span) => {
      span.setAttribute("franchise.slug", franchiseSlug)
      span.setAttribute("query.length", query.length)
      
      const response = await sendChatQuery(query)
      
      span.setAttribute("response.tokens", response.tokenCount)
      return response
    }
  )
}
\`\`\`

### Capturing Analysis Errors

\`\`\`typescript
async function analyzeWithVision(pageUrl: string) {
  try {
    const result = await visionAnalysis(pageUrl)
    return result
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        feature: "vision-analysis",
        pageUrl,
      },
    })
    throw error
  }
}
\`\`\`

### FDD Viewer Error

\`\`\`typescript
// In components/fdd-viewer.tsx
import { captureException, addBreadcrumb } from "@/lib/sentry"

const loadPDF = async () => {
  addBreadcrumb('Loading PDF', 'fdd', { fddId, pageNumber: currentPage })
  
  try {
    const pdf = await pdfjs.getDocument(pdfUrl).promise
    // ...
  } catch (error) {
    captureException(error, {
      user: { id: userId, email, role: userRole },
      page: `/fdd/${slug}`,
      fddId,
      franchiseId,
      action: 'load_pdf',
      extra: {
        pdfUrl,
        currentPage,
        totalPages,
        browserInfo: navigator.userAgent
      }
    })
  }
}
\`\`\`

### AI Chat Error

\`\`\`typescript
// In app/api/fdd/[fdd_id]/search/route.ts
import { captureApiException } from "@/lib/sentry"

export async function POST(request: Request) {
  try {
    const { query, conversationHistory } = await request.json()
    const response = await generateAIResponse(query)
    return NextResponse.json({ response })
  } catch (error) {
    captureApiException(error, request, {
      user: { id: user?.id, email: user?.email, role: userData?.role },
      fddId: params.fdd_id,
      action: 'ai_chat',
      extra: {
        query,
        conversationLength: conversationHistory?.length,
        model: 'gpt-4'
      }
    })
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 500 })
  }
}
\`\`\`

## Best Practices

1. **Use `lib/sentry.ts` utilities** instead of raw Sentry calls for automatic context enrichment
2. **Always include user context** (id, email, role) in every error capture
3. **Add FDDHub-specific IDs** (franchiseId, fddId, leadId) as tags for filtering
4. **Use breadcrumbs** to trace user actions leading up to errors
5. **Meaningful Names**: Use descriptive `name` and `op` values that clearly identify the action
6. **Relevant Attributes**: Add context that helps debugging (IDs, counts, statuses)
7. **Don't Over-Instrument**: Focus on key user flows and error-prone areas
8. **Use Appropriate Log Levels**: 
   - `trace`/`debug` for development
   - `info` for significant events
   - `warn` for recoverable issues
   - `error`/`fatal` for failures
