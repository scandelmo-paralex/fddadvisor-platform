import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

export async function POST(request: Request) {
  try {
    // Use createServerClient to get authenticated user (reads from cookies)
    const authClient = await createServerClient()
    
    // Use service role for database operations (bypasses RLS)
    const supabase = createServiceRoleClient()

    const body = await request.json()

    const {
      franchiseId: franchise_id,
      timeSpent: time_spent,
      sectionsViewed,
      viewedItems = [],
      questionsAsked = [],
    } = body

    try {
      // Check if auth client was created successfully
      if (!authClient) {
        console.log("[v0] Skipping engagement tracking - no auth client")
        return NextResponse.json({ success: true, engagement: null })
      }

      // Get user from auth client (has access to cookies/session)
      const {
        data: { user },
      } = await authClient.auth.getUser()

      if (!user || !franchise_id) {
        console.log("[v0] Skipping engagement tracking - no user or franchise_id. User:", !!user, "franchise_id:", franchise_id)
        return NextResponse.json({ success: true, engagement: null })
      }

      console.log("[v0] Processing engagement for user:", user.email, "franchise_id:", franchise_id)
      console.log("[v0] Raw input - viewedItems:", viewedItems, "sectionsViewed:", sectionsViewed, "timeSpent:", time_spent)

      // Get buyer profile to get buyer_id
      const { data: buyerProfile } = await supabase
        .from("buyer_profiles")
        .select("id, first_name, last_name, email")
        .eq("user_id", user.id)
        .single()

      if (!buyerProfile) {
        console.log("[v0] No buyer profile found for user:", user.id)
        return NextResponse.json({ success: true, engagement: null })
      }

      // fdd_engagements.buyer_id references auth.users(id) per actual FK constraint in database
      const buyer_id = user.id
      console.log("[v0] Using buyer_id:", buyer_id, "(auth.users.id) for user email:", user.email)
      const questions_count = Array.isArray(questionsAsked) ? questionsAsked.length : 0

      // Look up fdd_id from fdds table using franchise_id
      let fdd_id: string | null = null
      try {
        const { data: fddData } = await supabase
          .from("fdds")
          .select("id")
          .eq("franchise_id", franchise_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        
        fdd_id = fddData?.id || null
        console.log("[v0] Found fdd_id:", fdd_id, "for franchise_id:", franchise_id)
      } catch (fddError) {
        console.log("[v0] Could not look up fdd_id, will try without it")
      }
      // Frontend sends items like "item7", "item19" - extract the number part
      const viewed_items_array = Array.isArray(viewedItems)
        ? viewedItems
            .map((item) => {
              if (typeof item === "number") return item
              // Handle "item7" format - extract number after "item"
              const match = String(item).match(/item(\d+)/i)
              if (match) return Number.parseInt(match[1])
              // Handle plain number string like "7"
              const num = Number.parseInt(String(item))
              return isNaN(num) ? null : num
            })
            .filter((n): n is number => n !== null)
        : []

      console.log("[v0] Parsed viewed_items_array:", viewed_items_array, "from raw:", viewedItems)

      // Build section_name from sectionsViewed (take the most recent/primary one)
      const section_name = Array.isArray(sectionsViewed) && sectionsViewed.length > 0 
        ? sectionsViewed[sectionsViewed.length - 1] 
        : null

      // Check for existing engagement to update
      let existingEngagement = null
      try {
        const { data } = await supabase
          .from("fdd_engagements")
          .select("id, duration_seconds, viewed_items, questions_list, questions_asked")
          .eq("buyer_id", buyer_id)
          .eq("franchise_id", franchise_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        existingEngagement = data
      } catch (queryError) {
        console.log("[v0] Could not query existing engagement, will create new")
      }

      let result

      if (existingEngagement) {
        // Merge viewed items and questions
        const existingViewedItems = existingEngagement.viewed_items || []
        const mergedViewedItems = [...new Set([...existingViewedItems, ...viewed_items_array])]
        const existingQuestions = existingEngagement.questions_list || []
        const newQuestions = Array.isArray(questionsAsked) ? questionsAsked : []
        const mergedQuestions = [...new Set([...existingQuestions, ...newQuestions])]

        // Update existing engagement - only use columns that exist!
        const { data, error } = await supabase
          .from("fdd_engagements")
          .update({
            duration_seconds: Math.max(time_spent || 0, existingEngagement.duration_seconds || 0),
            section_name: section_name,
            viewed_items: mergedViewedItems,
            questions_asked: mergedQuestions.length,
            questions_list: mergedQuestions,
            timestamp: new Date().toISOString(),
          })
          .eq("id", existingEngagement.id)
          .select()
          .maybeSingle()

        if (error) throw error
        result = data
        console.log("[v0] Updated engagement for buyer:", buyer_id, "duration:", time_spent, "viewedItems:", mergedViewedItems)
      } else {
        // Create new engagement - only use columns that exist!
        const engagementData: Record<string, any> = {
          buyer_id,
          franchise_id,
          buyer_email: buyerProfile.email,
          buyer_name: `${buyerProfile.first_name || ''} ${buyerProfile.last_name || ''}`.trim() || null,
          event_type: 'fdd_view',
          section_name: section_name,
          duration_seconds: time_spent || 0,
          viewed_items: viewed_items_array,
          questions_asked: questions_count,
          questions_list: Array.isArray(questionsAsked) ? questionsAsked : [],
          timestamp: new Date().toISOString(),
          metadata: {
            sectionsViewed: sectionsViewed || [],
          },
        }
        
        // Add fdd_id if we found one (required by database schema)
        if (fdd_id) {
          engagementData.fdd_id = fdd_id
        } else {
          // fdd_id is required - if we don't have one, we can't create the engagement
          console.log("[v0] No fdd_id found for franchise_id:", franchise_id, "- cannot create engagement")
          return NextResponse.json({ success: true, engagement: null, message: "No FDD record found for this franchise" })
        }

        const { data, error } = await supabase
          .from("fdd_engagements")
          .insert(engagementData)
          .select()
          .maybeSingle()

        if (error) throw error
        result = data
        console.log("[v0] Created new engagement for buyer:", buyer_id, "duration:", time_spent, "fdd_id:", fdd_id)
      }

      return NextResponse.json({ success: true, engagement: result })
    } catch (engagementError: any) {
      console.log("[v0] Engagement tracking error:", engagementError.message)
      return NextResponse.json({ success: true, engagement: null })
    }
  } catch (error) {
    console.error("[v0] FDD engagement tracking error:", error)
    return NextResponse.json({ success: true, engagement: null })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    
    if (!supabase) {
      return NextResponse.json({ engagement: null })
    }
    
    const { searchParams } = new URL(request.url)
    const franchise_id = searchParams.get("franchise_id")

    if (!franchise_id) {
      return NextResponse.json({ error: "franchise_id is required" }, { status: 400 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // fdd_engagements.buyer_id stores auth.users.id (user.id)
    try {
      const { data, error } = await supabase
        .from("fdd_engagements")
        .select("*")
        .eq("buyer_id", user.id)
        .eq("franchise_id", franchise_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      return NextResponse.json({ engagement: data || null })
    } catch (engagementError: any) {
      return NextResponse.json({ engagement: null })
    }
  } catch (error) {
    console.error("[v0] FDD engagement fetch error:", error)
    return NextResponse.json({ engagement: null })
  }
}
