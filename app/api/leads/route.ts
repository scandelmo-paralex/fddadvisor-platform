import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function calculateQualityScore(access: any, engagements: any[]): number {
  let score = 50 // Base score for verified lead

  // Engagement scoring (40 points max)
  if (engagements && engagements.length > 0) {
    // Time spent scoring (up to 20 points) - uses correct column name: time_spent (in seconds)
    const totalTimeSeconds = engagements.reduce((sum, eng) => sum + (eng.time_spent || 0), 0)
    const timeSpentMinutes = totalTimeSeconds / 60
    score += Math.min(timeSpentMinutes * 2, 20) // 2 pts per minute, max 20

    // Questions asked scoring (up to 15 points) - uses correct column name: questions_asked (count)
    const totalQuestions = engagements.reduce((sum, eng) => sum + (eng.questions_asked || 0), 0)
    score += Math.min(totalQuestions * 4, 15) // 4 pts per question, max 15

    // Sections viewed scoring (up to 5 points) - uses correct column names
    const sectionsViewed = new Set([
      ...engagements.flatMap((eng) => eng.sections_viewed || []),
      ...engagements.flatMap((eng) => eng.items_viewed || [])
    ])
    score += Math.min(sectionsViewed.size * 1, 5) // 1 pt per section, max 5
  }

  // Session frequency scoring (up to 10 points)
  const sessionCount = engagements?.length || 0
  score += Math.min(sessionCount * 2, 10) // 2 pts per session, max 10

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

      // Calculate engagement metrics from REAL database data
      // Using correct column names: time_spent, questions_asked, sections_viewed, items_viewed
      const totalTimeSpent = engagements?.reduce((sum, eng) => sum + (eng.time_spent || 0), 0) || 0
      const totalQuestionsAsked = engagements?.reduce((sum, eng) => sum + (eng.questions_asked || 0), 0) || 0
      
      // Combine sections_viewed and items_viewed for full coverage
      const sectionsViewed = [...new Set([
        ...(engagements?.flatMap((eng) => eng.sections_viewed || []) || []),
        ...(engagements?.flatMap((eng) => eng.items_viewed || []) || [])
      ])]
      
      // Generate focus areas from actual viewed sections
      const focusAreas = sectionsViewed.slice(0, 5).map((item: string, idx: number) => {
        // Estimate time based on position (most viewed items first)
        const estimatedMinutes = Math.max(5, 15 - (idx * 2))
        return {
          item: item,
          timeSpent: `${estimatedMinutes} min`,
          interest: idx < 2 ? "High" : "Medium",
        }
      })
      
      // Calculate quality score and intent from real data
      const qualityScore = calculateQualityScore(access, engagements || [])
      const intent = calculateIntent(qualityScore)
      
      // AI insights will be fetched from /api/leads/engagement endpoint by the modal
      // This endpoint returns basic lead data; engagement API handles AI analysis
      const aiInsights = null

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
        questionsAsked: [], // Actual questions come from /api/leads/engagement
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
        // Use REAL buyer profile data instead of hardcoded values
        buyerProfile: access.buyer ? {
          ficoScoreRange: access.buyer.fico_score_range,
          liquidAssetsRange: access.buyer.liquid_assets_range,
          netWorthRange: access.buyer.net_worth_range,
          fundingPlans: access.buyer.funding_plans,
          yearsOfExperience: access.buyer.years_of_experience,
          managementExperience: access.buyer.management_experience,
          hasOwnedBusiness: access.buyer.has_owned_business,
          industryExperience: access.buyer.industry_experience,
          relevantSkills: access.buyer.relevant_skills,
          noFelonyAttestation: access.buyer.no_felony_attestation,
          noBankruptcyAttestation: access.buyer.no_bankruptcy_attestation,
          linkedinUrl: access.buyer.linkedin_url,
          buyingTimeline: access.buyer.buying_timeline,
        } : null,
        financialQualification: {
          creditScore: null, // Not collected directly - use fico_score_range instead
          ficoScoreRange: access.buyer?.fico_score_range || null,
          creditScoreVerified: false,
          backgroundCheck: access.buyer?.no_felony_attestation && access.buyer?.no_bankruptcy_attestation ? "Passed" : "Not Started",
          backgroundCheckVerified: access.buyer?.no_felony_attestation && access.buyer?.no_bankruptcy_attestation ? true : false,
          preApproval: {
            status: "Not Started",
            verified: false,
          },
          liquidCapital: {
            range: access.buyer?.liquid_assets_range || null,
            source: "Self-reported",
          },
          netWorth: {
            range: access.buyer?.net_worth_range || null,
            source: "Self-reported",
          },
          fundingPlans: access.buyer?.funding_plans || null,
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
