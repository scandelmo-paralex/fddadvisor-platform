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

      const buyer_id = buyerProfile.id
      const questions_count = Array.isArray(questionsAsked) ? questionsAsked.length : 0
      const viewed_items_array = Array.isArray(viewedItems)
        ? viewedItems.map((item) => (typeof item === "number" ? item : Number.parseInt(item))).filter((n) => !isNaN(n))
        : []

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
        const engagementData = {
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

        const { data, error } = await supabase
          .from("fdd_engagements")
          .insert(engagementData)
          .select()
          .maybeSingle()

        if (error) throw error
        result = data
        console.log("[v0] Created new engagement for buyer:", buyer_id, "duration:", time_spent)
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

    // Get buyer_profiles.id from user_id
    const { data: buyerProfile } = await supabase
      .from("buyer_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!buyerProfile) {
      return NextResponse.json({ engagement: null })
    }

    try {
      const { data, error } = await supabase
        .from("fdd_engagements")
        .select("*")
        .eq("buyer_id", buyerProfile.id)
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
