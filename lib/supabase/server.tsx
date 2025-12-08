import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

// ----------------------------------------------------------------------------
// STANDARD SERVER CLIENT (for most server-side operations)
// ----------------------------------------------------------------------------
export async function createServerClient(): Promise<SupabaseClient | null> {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[v0] Missing Supabase environment variables in createServerClient")
    return null
  }

  try {
    return createSupabaseServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Ignore if called from Server Component
          }
        },
      },
    })
  } catch (error) {
    console.error("[v0] Error creating Supabase server client:", error)
    return null
  }
}

// ----------------------------------------------------------------------------
// API ROUTE CLIENT (for app/api/**/route.ts)
// CRITICAL: This is synchronous and maintains auth context properly
// ----------------------------------------------------------------------------
export function getSupabaseRouteClient() {
  const cookieStore = cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[v0] Missing Supabase environment variables in getSupabaseRouteClient")
    return null
  }

  try {
    return createSupabaseServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Ignore cookie errors in API routes
          }
        },
      },
    })
  } catch (error) {
    console.error("[v0] Error creating Supabase route client:", error)
    return null
  }
}

// ----------------------------------------------------------------------------
// SERVER COMPONENT CLIENT (for page.tsx without "use client")
// ----------------------------------------------------------------------------
export async function getSupabaseServerClient() {
  return createServerClient()
}

// ----------------------------------------------------------------------------
// SERVICE ROLE CLIENT (bypasses RLS - for webhooks/admin)
// ----------------------------------------------------------------------------
export function getSupabaseServiceClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "", {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

// Backward compatibility exports
export { createServerClient as createClient }
