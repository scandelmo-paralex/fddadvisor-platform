import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    console.log("[v0] Starting franchises API request")

    let supabase
    try {
      supabase = await createServerClient()
      console.log("[v0] Supabase client created successfully")
    } catch (clientError) {
      console.error("[v0] Failed to create Supabase client:", clientError)
      return NextResponse.json(
        {
          error: "Failed to connect to database. Please check your Supabase integration in the Connect section.",
          franchises: [],
        },
        { status: 500 },
      )
    }

    if (!supabase) {
      console.error("[v0] Supabase client is null")
      return NextResponse.json({ error: "Database client not initialized", franchises: [] }, { status: 500 })
    }

    console.log("[v0] Executing Supabase query...")

    let queryResult
    try {
      queryResult = await supabase
        .from("franchises")
        .select(
          `
          id,
          name,
          industry,
          description,
          logo_url,
          cover_image_url,
          franchise_score,
          score_financial_performance,
          score_business_model,
          score_support_training,
          score_legal_compliance,
          score_franchisee_satisfaction,
          opportunities,
          concerns,
          initial_investment_low,
          initial_investment_high,
          franchise_fee,
          royalty_fee,
          marketing_fee,
          total_units,
          franchised_units,
          company_owned_units,
          units_opened_last_year,
          units_closed_last_year,
          litigation_count,
          bankruptcy_count,
          investment_breakdown,
          average_revenue,
          revenue_data,
          franchise_score_breakdown,
          analytical_summary,
          slug,
          fdds!franchise_id(
            id,
            pdf_url,
            pdf_path,
            is_public
          )
        `,
        )
        .order("franchise_score", { ascending: false, nullsLast: true })

      console.log("[v0] Query executed, checking results...")
    } catch (queryError) {
      console.error("[v0] Query execution error:", queryError)
      console.error("[v0] Query error type:", typeof queryError)
      console.error("[v0] Query error details:", JSON.stringify(queryError, null, 2))
      return NextResponse.json(
        {
          error: "Database query failed",
          franchises: [],
          details: queryError instanceof Error ? queryError.message : String(queryError),
        },
        { status: 500 },
      )
    }

    const { data: franchises, error } = queryResult

    if (error) {
      console.error("[v0] Franchises fetch error:", error)
      console.error("[v0] Error type:", typeof error)
      console.error("[v0] Error details:", JSON.stringify(error, null, 2))

      if (error.message?.includes("Invalid API key") || error.message?.includes("API key")) {
        return NextResponse.json(
          {
            error: "Invalid Supabase API key. Please reconnect your Supabase integration in the Connect section of v0.",
            franchises: [],
            hint: "Go to Connect → Supabase → Reconnect to refresh your API keys",
          },
          { status: 401 },
        )
      }

      return NextResponse.json({ error: error.message, franchises: [] }, { status: 500 })
    }

    console.log("[v0] Fetched franchises:", franchises?.length || 0)

    const franchisesWithSlug =
      franchises?.map((f) => ({
        ...f,
        slug:
          f.slug ||
          f.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "") ||
          f.id,
      })) || []

    return NextResponse.json({ franchises: franchisesWithSlug }, { status: 200 })
  } catch (error) {
    console.error("[v0] Franchises API error:", error)
    console.error("[v0] Error type:", typeof error)
    if (error instanceof Error) {
      console.error("[v0] Error name:", error.name)
      console.error("[v0] Error message:", error.message)
      console.error("[v0] Error stack:", error.stack)
    } else {
      console.error("[v0] Non-Error object:", JSON.stringify(error, null, 2))
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        errorType: error instanceof Error ? error.name : typeof error,
        franchises: [],
      },
      { status: 500 },
    )
  }
}
