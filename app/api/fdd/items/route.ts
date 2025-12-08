import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fddId = searchParams.get("fdd_id")

    if (!fddId) {
      return NextResponse.json({ error: "fdd_id is required" }, { status: 400 })
    }

    const supabase = await createServerClient()

    // Fetch distinct item numbers and their first page from fdd_chunks
    const { data: items, error } = await supabase
      .from("fdd_chunks")
      .select("item_number, page_number")
      .eq("fdd_id", fddId)
      .not("item_number", "is", null)
      .order("item_number", { ascending: true })
      .order("page_number", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching FDD items:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by item_number and get the first page for each item
    const itemMap = new Map<number, number>()
    items?.forEach((item) => {
      if (item.item_number && !itemMap.has(item.item_number)) {
        itemMap.set(item.item_number, item.page_number)
      }
    })

    // Convert to array of objects
    const fddItems = Array.from(itemMap.entries())
      .map(([itemNumber, pageNumber]) => ({
        itemNumber,
        pageNumber,
        label: `Item ${itemNumber}`,
      }))
      .sort((a, b) => a.itemNumber - b.itemNumber)

    return NextResponse.json({ items: fddItems }, { status: 200 })
  } catch (error) {
    console.error("[v0] FDD items API error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
