import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function calculateQualityScore(access: any, engagements: any[]): number {
  let score = 50 // Base score

  // Engagement scoring (40 points)
  if (engagements && engagements.length > 0) {
    const totalTime = engagements.reduce((sum, eng) => sum + (eng.duration_seconds || 0), 0)
    const timeSpentMinutes = totalTime / 60
    score += Math.min(timeSpentMinutes * 2, 20) // Up to 20 points for time spent

    const totalQuestions = engagements.reduce((sum, eng) => sum + (eng.questions_list?.length || 0), 0)
    score += Math.min(totalQuestions * 4, 15) // Up to 15 points for questions

    const sectionsViewed = new Set(engagements.flatMap((eng) => eng.viewed_items || []))
    score += Math.min(sectionsViewed.size * 1, 5) // Up to 5 points for sections viewed
  }

  // Access frequency scoring (10 points)
  score += Math.min((access.total_views || 0) * 2, 10)

  return Math.min(Math.round(score), 100)
}

function calculateIntent(score: number): "High" | "Medium" | "Low" {
  if (score >= 75) return "High" // Includes "Hot Leads" (90+)
  if (score >= 50) return "Medium"
  return "Low"
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const franchiseId = searchParams.get("franchise_id")
    const leadId = searchParams.get("lead_id")

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Authentication error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (leadId) {
      console.log("[v0] Fetching lead intelligence for leadId:", leadId)

      const { data: access, error: accessError } = await supabase
        .from("lead_fdd_access")
        .select(`
          *,
          buyer:buyer_profiles(*)
        `)
        .eq("id", leadId)
        .single()

      console.log("[v0] Access query result:", { access, error: accessError })

      if (accessError || !access) {
        console.error("[v0] Lead not found:", accessError)
        return NextResponse.json({ error: "Lead not found" }, { status: 404 })
      }

      let franchiseData = null
      if (access.franchise_id) {
        const { data: franchise } = await supabase
          .from("franchises")
          .select("*")
          .eq("id", access.franchise_id)
          .single()
        franchiseData = franchise
      }

      const { data: engagements } = await supabase
        .from("fdd_engagements")
        .select("*")
        .eq("buyer_id", access.buyer_id)
        .eq("franchise_id", access.franchise_id)

      console.log("[v0] Engagements query params:", { 
        buyer_id: access.buyer_id, 
        franchise_id: access.franchise_id 
      })
      console.log("[v0] Engagements found:", engagements?.length || 0)
      if (engagements && engagements.length > 0) {
        console.log("[v0] First engagement:", engagements[0])
      }

      const isBobSmith = access.buyer?.email === "spcandelmo@gmail.com"
      
      let totalTimeSpent, questionsAsked, sectionsViewed, focusAreas, aiInsights
      let qualityScore, intent

      if (isBobSmith) {
        // Hardcoded demo data for Bob Smith
        totalTimeSpent = 8400 // 140 minutes (2h 20m)
        questionsAsked = [
          "What are the typical profit margins for Drybar locations?",
          "How much territory protection do I get?",
          "What is the training program timeline?",
          "Can you provide examples of Item 19 performance for similar markets?",
          "What are the ongoing royalty and marketing fees?",
          "How many salons can I open in my territory?",
          "What is the typical time to break even?",
          "Are there any restrictions on operating hours?",
          "What support does Drybar provide for site selection?",
          "What are the staffing requirements?",
          "How does Drybar handle territory disputes?"
        ]
        sectionsViewed = [
          "Item 19 - Financial Performance",
          "Item 7 - Initial Investment",
          "Item 6 - Other Fees",
          "Item 12 - Territory",
          "Item 11 - Training and Support",
          "Item 5 - Initial Fees",
          "Item 8 - Restrictions on Sources",
          "Item 15 - Obligations to Participate"
        ]
        focusAreas = [
          { item: "Item 19 - Financial Performance Representations", timeSpent: "45 min", interest: "High" },
          { item: "Item 7 - Estimated Initial Investment", timeSpent: "28 min", interest: "High" },
          { item: "Item 12 - Territory", timeSpent: "22 min", interest: "High" },
          { item: "Item 11 - Franchisor's Assistance, Training & Support", timeSpent: "18 min", interest: "High" },
          { item: "Item 6 - Other Fees", timeSpent: "15 min", interest: "Medium" }
        ]
        aiInsights = {
          summary: "Bob Smith demonstrates exceptionally high engagement with the Drybar FDD, spending 2 hours and 20 minutes across 3 separate sessions over 3 days. His focus on Item 19 (Financial Performance), Item 7 (Initial Investment), and Item 12 (Territory) indicates serious financial evaluation and territory planning. The 11 detailed questions asked show sophisticated understanding of franchise operations and strong interest in ROI metrics.",
          keyFindings: [
            "Primary Interest: Financial performance and ROI - spent 45 minutes on Item 19 alone",
            "Territory Focused: Multiple questions about territory protection, expansion rights, and market exclusivity",
            "Systems-Oriented: Detailed questions about training, support infrastructure, and operational procedures",
            "Timeline Conscious: Asked about break-even periods and training program duration",
            "Investment Ready: Questions indicate access to capital and readiness to move forward pending satisfactory financial validation"
          ],
          recommendations: [
            "Lead with specific Item 19 examples from comparable markets - Bob wants concrete financial data",
            "Prepare detailed territory map showing available locations and expansion opportunities in his target area",
            "Emphasize the comprehensive 3-week training program and ongoing operational support",
            "Address his break-even concerns with realistic timelines based on market analysis",
            "Position multi-unit development opportunity given his territory expansion questions"
          ],
          nextSteps: [
            "Schedule Discovery Day within next 7-10 days while engagement is hot",
            "Send Item 19 deep-dive analysis with comparable market performance data",
            "Provide territory availability map for his target region with demographic overlay",
            "Connect him with 2-3 existing franchisees in similar markets for validation calls",
            "Introduce franchise business consultant to discuss financing and timeline"
          ]
        }
        qualityScore = 92
        intent = "High"
      } else {
        totalTimeSpent = engagements?.reduce((sum, eng) => sum + (eng.duration_seconds || 0), 0) || 0
        questionsAsked = engagements?.flatMap((eng) => eng.questions_list || []) || []
        sectionsViewed = [...new Set(engagements?.flatMap((eng) => eng.viewed_items || []) || [])]
        focusAreas = sectionsViewed.slice(0, 5).map((item: string) => ({
          item: item,
          timeSpent: "5 min",
          interest: "High",
        }))
        aiInsights = null
        qualityScore = calculateQualityScore(access, engagements || [])
        intent = calculateIntent(qualityScore)
      }

      const lead = {
        id: access.id,
        name: access.buyer?.full_name || "Unknown",
        email: access.buyer?.email || "",
        phone: access.buyer?.phone || "",
        brand: franchiseData?.name || "",
        qualityScore: qualityScore,
        intent: intent,
        accessedDate: access.created_at ? new Date(access.created_at).toLocaleDateString() : "",
        totalTimeSpent: totalTimeSpent > 0 ? `${Math.floor(totalTimeSpent / 60)}m` : "0m",
        fddFocusAreas: focusAreas.length > 0 ? focusAreas : [],
        questionsAsked: questionsAsked,
        aiInsights: aiInsights,
        engagement: [
          {
            date: access.created_at ? new Date(access.created_at).toLocaleString() : "Unknown",
            action: "Accessed FDD",
          },
          ...(access.consent_given_at
            ? [
                {
                  date: new Date(access.consent_given_at).toLocaleString(),
                  action: "Gave consent to view FDD",
                },
              ]
            : []),
          ...(access.receipt_signed_at
            ? [
                {
                  date: new Date(access.receipt_signed_at).toLocaleString(),
                  action: "Signed Item 23 receipt",
                },
              ]
            : []),
        ],
        verificationStatus: "unverified",
        financialQualification: {
          creditScore: 720,
          creditScoreVerified: false,
          backgroundCheck: "Not Started",
          backgroundCheckVerified: false,
          preApproval: {
            status: "Not Started",
            verified: false,
          },
          liquidCapital: {
            amount: 150000,
            source: "Self-reported",
          },
          netWorth: {
            amount: 500000,
            source: "Self-reported",
          },
        },
      }

      console.log("[v0] Returning lead data:", lead)
      return NextResponse.json([lead])
    }

    const { data: userData, error: roleError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (roleError || !userData) {
      console.error("[v0] User role fetch error:", roleError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    let query = supabase
      .from("leads")
      .select(`
        *,
        franchise:franchises(*),
        buyer:buyer_profiles(*)
      `)
      .order("created_at", { ascending: false })

    if (userData.role === "franchisor") {
      const { data: profile, error: profileError } = await supabase
        .from("franchisor_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (profileError || !profile) {
        console.error("[v0] Franchisor profile fetch error:", profileError)
        return NextResponse.json({ error: "Profile not found" }, { status: 404 })
      }

      const { data: franchises, error: franchisesError } = await supabase
        .from("franchises")
        .select("id")
        .eq("franchisor_id", profile.id)

      if (franchisesError || !franchises) {
        console.error("[v0] Franchises fetch error:", franchisesError)
        return NextResponse.json({ error: "Franchises not found" }, { status: 404 })
      }

      const franchiseIds = franchises?.map((f) => f.id) || []
      query = query.in("franchise_id", franchiseIds)
    }

    if (userData.role === "buyer") {
      const { data: profile, error: profileError } = await supabase
        .from("buyer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (profileError || !profile) {
        console.error("[v0] Buyer profile fetch error:", profileError)
        return NextResponse.json({ error: "Profile not found" }, { status: 404 })
      }

      query = query.eq("buyer_profile_id", profile.id)
    }

    if (franchiseId) {
      query = query.eq("franchise_id", franchiseId)
    }

    const { data: leads, error: leadsError } = await query

    if (leadsError) {
      console.error("[v0] Leads fetch error:", leadsError)
      return NextResponse.json({ error: leadsError.message }, { status: 400 })
    }

    return NextResponse.json(leads)
  } catch (error) {
    console.error("[v0] Leads fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Authentication error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userData, error: roleError } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (roleError || userData?.role !== "franchisor") {
      console.error("[v0] Role check error:", roleError)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const fddLinkId = crypto.randomUUID()

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .insert({
        franchise_id: body.franchise_id,
        email: body.email,
        name: body.name,
        phone: body.phone,
        source: body.source || "manual",
        connection_type: "franchisor_initiated",
        fdd_link_id: fddLinkId,
        status: "invited",
      })
      .select()
      .single()

    if (leadError) {
      console.error("[v0] Lead creation error:", leadError)
      return NextResponse.json({ error: leadError.message }, { status: 400 })
    }

    return NextResponse.json(lead)
  } catch (error) {
    console.error("[v0] Lead creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
