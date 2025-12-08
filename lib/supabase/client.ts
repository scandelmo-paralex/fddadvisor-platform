// ============================================================================
// CLIENT-SIDE SUPABASE PATTERNS
// Use these in client components and browser code
// ============================================================================

import { createBrowserClient as createSupabaseBrowserClientSSR } from "@supabase/ssr"

// ----------------------------------------------------------------------------
// CLIENT COMPONENTS (React components with "use client")
// ----------------------------------------------------------------------------
// Use this in: Dashboard components, interactive UI, client-side data fetching
export function getSupabaseClient() {
  return createSupabaseBrowserClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )
}

// ----------------------------------------------------------------------------
// DEFAULT CLIENT (for backward compatibility)
// ----------------------------------------------------------------------------
// This is what login page and other components use
export function createClient() {
  return createSupabaseBrowserClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )
}

// Alias for compatibility
export function createBrowserClient() {
  return createSupabaseBrowserClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  )
}

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.log("[v0] Supabase environment variables not available")
    return null
  }

  return createSupabaseBrowserClientSSR(url, key)
}
