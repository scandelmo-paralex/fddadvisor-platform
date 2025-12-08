import * as Sentry from "@sentry/nextjs"
import type { UserRole } from "@/lib/types/database"

// Types for Sentry context
interface SentryUser {
  id?: string
  email?: string
  role?: UserRole
}

interface SentryContext {
  user?: SentryUser
  tags?: Record<string, string | number | boolean | undefined>
  extra?: Record<string, unknown>
}

interface CaptureOptions extends SentryContext {
  // Common FDDHub-specific IDs
  franchiseId?: string
  fddId?: string
  leadId?: string
  engagementId?: string
  // Page/route info
  page?: string
  action?: string
  // Additional context
  component?: string
  apiEndpoint?: string
}

/**
 * Set the current user context for all subsequent Sentry events
 * Call this when user logs in or on page load
 */
export function setSentryUser(user: SentryUser | null) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    })
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Capture an exception with enhanced FDDHub context
 * Use this instead of Sentry.captureException() for richer error reports
 */
export function captureException(error: unknown, options: CaptureOptions = {}) {
  const {
    user,
    tags = {},
    extra = {},
    franchiseId,
    fddId,
    leadId,
    engagementId,
    page,
    action,
    component,
    apiEndpoint,
  } = options

  // Build tags object with FDDHub-specific IDs
  const enrichedTags: Record<string, string> = {}

  if (page) enrichedTags.page = page
  if (action) enrichedTags.action = action
  if (component) enrichedTags.component = component
  if (apiEndpoint) enrichedTags.api_endpoint = apiEndpoint
  if (franchiseId) enrichedTags.franchise_id = franchiseId
  if (fddId) enrichedTags.fdd_id = fddId
  if (leadId) enrichedTags.lead_id = leadId
  if (engagementId) enrichedTags.engagement_id = engagementId

  // Add custom tags
  Object.entries(tags).forEach(([key, value]) => {
    if (value !== undefined) {
      enrichedTags[key] = String(value)
    }
  })

  Sentry.captureException(error, {
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      : undefined,
    tags: enrichedTags,
    extra: {
      ...extra,
      timestamp: new Date().toISOString(),
    },
  })
}

/**
 * Capture an exception in an API route with request context
 */
export function captureApiException(error: unknown, request: Request, options: CaptureOptions = {}) {
  const url = new URL(request.url)

  captureException(error, {
    ...options,
    apiEndpoint: url.pathname,
    extra: {
      ...options.extra,
      method: request.method,
      searchParams: Object.fromEntries(url.searchParams),
    },
  })
}

/**
 * Capture an exception in a React component
 */
export function captureComponentException(error: unknown, componentName: string, options: CaptureOptions = {}) {
  captureException(error, {
    ...options,
    component: componentName,
    tags: {
      ...options.tags,
      error_boundary: "component",
    },
  })
}

/**
 * Create a Sentry transaction for performance monitoring
 */
export function startTransaction(name: string, op: string, data?: Record<string, unknown>) {
  return Sentry.startSpan(
    {
      name,
      op,
      attributes: data as Record<string, string | number | boolean>,
    },
    (span) => span,
  )
}

/**
 * Add breadcrumb for user actions
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: Sentry.SeverityLevel = "info",
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  })
}

/**
 * Helper to extract user context from Supabase auth response
 */
export function extractUserContext(
  authUser: { id: string; email?: string } | null,
  userData?: { role?: UserRole } | null,
): SentryUser | undefined {
  if (!authUser) return undefined

  return {
    id: authUser.id,
    email: authUser.email,
    role: userData?.role,
  }
}

/**
 * Wrap an async function with Sentry error capture
 */
export function withSentryCapture<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: CaptureOptions = {},
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      captureException(error, options)
      throw error
    }
  }) as T
}
