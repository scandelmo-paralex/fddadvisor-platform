import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createServerClient()

    // Query the information_schema to get all tables in the public schema
    const { data: tables, error } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .order("table_name")

    if (error) {
      // Fallback: Try direct SQL query
      const { data: tablesData, error: sqlError } = await supabase.rpc("get_tables")

      if (sqlError) {
        console.error("Error fetching tables:", sqlError)
        return NextResponse.json({ error: sqlError.message }, { status: 500 })
      }

      return NextResponse.json({ tables: tablesData })
    }

    return NextResponse.json({ tables: tables?.map((t) => t.table_name) || [] })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to fetch tables" }, { status: 500 })
  }
}
