import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const { data: franchises, error } = await supabase.from("franchises").select("*").limit(1)

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          details: error,
        },
        { status: 500 },
      )
    }

    // Extract column names from the first franchise
    const columnNames = franchises && franchises.length > 0 ? Object.keys(franchises[0]) : []

    // Get detailed info about each column
    const columnInfo =
      franchises && franchises.length > 0
        ? columnNames.map((col) => ({
            name: col,
            type: typeof franchises[0][col],
            value: franchises[0][col],
            isNull: franchises[0][col] === null,
            isUndefined: franchises[0][col] === undefined,
          }))
        : []

    return NextResponse.json({
      success: true,
      totalFranchises: franchises?.length || 0,
      columnNames,
      columnInfo,
      sampleFranchise: franchises?.[0] || null,
      // Check for specific fields we need
      hasInvestmentBreakdown: franchises?.[0]?.investment_breakdown !== undefined,
      hasFranchisedUnits: franchises?.[0]?.franchised_units !== undefined,
      hasStateDistribution: franchises?.[0]?.state_distribution !== undefined,
      hasItem19: franchises?.[0]?.item19 !== undefined,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
