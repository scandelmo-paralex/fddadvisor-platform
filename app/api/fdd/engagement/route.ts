import { NextResponse } from "next/server"
import { createServerClient, createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    // Use createServerClient to get authenticated user (reads from cookies)
    const authClient = await createServerClient()
    
    // Use service role for database operations (bypasses RLS)
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const body = await request.json()

    const {
      franchiseId: franchise_id,
      franchiseSlug: franchise_slug,
      timeSpent: time_spent,
      sectionsViewed,
      viewedItems = [],
      questionsAsked = [],
      lastActivity,
      sessionId: session_id,
      notesCreated = 0,
      downloaded = false,
      downloadedAt,
      viewedFDD = false,
      askedQuestions = false,
      viewedItem19 = false,
      viewedItem7 = false,
      createdNotes = false,
      spentSignificantTime = false,
    } = body

    try {
      // Get user from auth client (has access to cookies/session)
      const {
        data: { user },
      } = await authClient.auth.getUser()

      if (!user || !franchise_id) {
        console.log("[v0] Skipping engagement tracking - no user or franchise_id. User:", !!user, "franchise_id:", franchise_id)
        return NextResponse.json({ success: true, engagement: null })
      }

      const { data: buyerProfile } = await supabase.from("buyer_profiles").select("id").eq("user_id", user.id).single()

      if (!buyerProfile) {
        console.log("[v0] No buyer profile found for user:", user.id)
        return NextResponse.json({ success: true, engagement: null })
      }

      const buyer_id = buyerProfile.id
      const questions_count = Array.isArray(questionsAsked) ? questionsAsked.length : 0
      const viewed_items_array = Array.isArray(viewedItems)
        ? viewedItems.map((item) => (typeof item === "number" ? item : Number.parseInt(item))).filter((n) => !isNaN(n))
        : []

      const engagementData = {
        buyer_id,
        franchise_id,
        franchise_slug: franchise_slug || "unknown",
        time_spent: time_spent || 0,
        sections_viewed: Array.isArray(sectionsViewed) ? sectionsViewed : [],
        viewed_items: viewed_items_array,
        questions_asked: questions_count,
        questions_list: Array.isArray(questionsAsked) ? questionsAsked : [],
        last_activity: lastActivity || new Date().toISOString(),
        session_id,
        duration_seconds: time_spent || 0,
        notes_created: notesCreated,
        downloaded: downloaded,
        downloaded_at: downloadedAt || null,
        viewed_fdd: viewedFDD || time_spent > 0,
        asked_questions: askedQuestions || questions_count > 0,
        viewed_item19: viewedItem19 || viewed_items_array.includes(19),
        viewed_item7: viewedItem7 || viewed_items_array.includes(7),
        created_notes: createdNotes || notesCreated > 0,
        spent_significant_time: spentSignificantTime || time_spent >= 600,
      }

      let existingEngagement = null
      try {
        const { data } = await supabase
          .from("fdd_engagements")
          .select("id, duration_seconds, time_spent, viewed_items, questions_list")
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
        const existingViewedItems = existingEngagement.viewed_items || []
        const mergedViewedItems = [...new Set([...existingViewedItems, ...viewed_items_array])]
        const existingQuestions = existingEngagement.questions_list || []
        const newQuestions = Array.isArray(questionsAsked) ? questionsAsked : []
        const mergedQuestions = [...new Set([...existingQuestions, ...newQuestions])]

        const { data, error } = await supabase
          .from("fdd_engagements")
          .update({
            duration_seconds: Math.max(time_spent || 0, existingEngagement.duration_seconds || 0),
            time_spent: Math.max(time_spent || 0, existingEngagement.time_spent || 0),
            sections_viewed: Array.isArray(sectionsViewed) ? sectionsViewed : [],
            viewed_items: mergedViewedItems,
            questions_asked: mergedQuestions.length,
            questions_list: mergedQuestions,
            last_activity: lastActivity || new Date().toISOString(),
            // Update milestone flags
            notes_created: notesCreated,
            downloaded: downloaded,
            downloaded_at: downloadedAt || null,
            viewed_fdd: true,
            asked_questions: mergedQuestions.length > 0,
            viewed_item19: mergedViewedItems.includes(19),
            viewed_item7: mergedViewedItems.includes(7),
            created_notes: notesCreated > 0,
            spent_significant_time: Math.max(time_spent || 0, existingEngagement.time_spent || 0) >= 600,
          })
          .eq("id", existingEngagement.id)
          .select()
          .maybeSingle()

        if (error) throw error
        result = data
        console.log("[v0] Updated engagement for buyer:", buyer_id, "viewedItems:", mergedViewedItems)
      } else {
        const { data, error } = await supabase.from("fdd_engagements").insert(engagementData).select().maybeSingle()

        if (error) throw error
        result = data
        console.log("[v0] Created new engagement for buyer:", buyer_id)
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
    const { searchParams } = new URL(request.url)
    const franchise_slug = searchParams.get("franchise_slug")

    if (!franchise_slug) {
      return NextResponse.json({ error: "franchise_slug is required" }, { status: 400 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      const { data, error } = await supabase
        .from("fdd_engagements")
        .select("*")
        .eq("user_id", user.id)
        .eq("franchise_slug", franchise_slug)
        .order("last_activity", { ascending: false })
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
