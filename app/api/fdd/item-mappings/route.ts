import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { searchParams } = new URL(request.url)
    const franchiseSlug = searchParams.get("franchise_slug")
    const fddId = searchParams.get("fdd_id")

    console.log("[v0] === GET /api/fdd/item-mappings ===")
    console.log("[v0] Request params:", { franchiseSlug, fddId })

    if (!franchiseSlug && !fddId) {
      return NextResponse.json({ error: "franchise_slug or fdd_id is required" }, { status: 400 })
    }

    let slugToQuery = franchiseSlug

    // If only fdd_id is provided, we need to join with franchises table
    if (fddId && !franchiseSlug) {
      console.log("[v0] Resolving fdd_id to franchise_slug...")
      const { data: fddData, error: fddError } = await supabase
        .from("fdds")
        .select("franchise_id, franchises(slug)")
        .eq("id", fddId)
        .single()

      console.log("[v0] FDD lookup result:", { fddData, fddError })

      if (fddError || !fddData) {
        console.error("[v0] Error fetching fdd:", fddError)
        return NextResponse.json({ items: [], mappings: [] })
      }

      slugToQuery = (fddData.franchises as any)?.slug
      console.log("[v0] Resolved franchise_slug:", slugToQuery)
    }

    if (!slugToQuery) {
      console.log("[v0] No franchise_slug found, returning empty array")
      return NextResponse.json({ items: [], mappings: [] })
    }

    console.log("[v0] Querying fdd_item_page_mappings table...")
    console.log("[v0] Query franchise_slug:", slugToQuery)

    const { data, error } = await supabase
      .from("fdd_item_page_mappings")
      .select("*")
      .eq("franchise_slug", slugToQuery)
      .order("mapping_type")
      .order("item_number", { nullsFirst: false })

    if (error) {
      console.error("[v0] Database error:", error)
      if (error.code === "PGRST205" || error.message?.includes("Could not find the table")) {
        console.log("[v0] Table fdd_item_page_mappings not found, returning empty array")
        return NextResponse.json({ items: [], mappings: [] })
      }
      throw error
    }

    console.log("[v0] Query result:", {
      count: data?.length || 0,
      sample: data?.[0],
    })

    if (!data || data.length === 0) {
      console.log("[v0] ⚠️ No mappings found for slug:", slugToQuery)

      // Debug: Check what franchise_slugs are actually in the database
      const { data: allMappings } = await supabase.from("fdd_item_page_mappings").select("franchise_slug").limit(100)

      const uniqueSlugs = [...new Set(allMappings?.map((m) => m.franchise_slug) || [])]
      console.log("[v0] Available franchise_slugs in database:", uniqueSlugs)

      return NextResponse.json({
        items: [],
        mappings: [],
        debug: {
          queriedSlug: slugToQuery,
          availableSlugs: uniqueSlugs,
          message: "No mappings found. Check if franchise_slug matches what was saved.",
        },
      })
    }

    const items = data
      .filter((m) => m.mapping_type === "item")
      .map((m) => ({
        itemNumber: m.item_number,
        pageNumber: m.page_number,
        label: m.label,
      }))

    console.log("[v0] Returning response:")
    console.log("[v0]   - Items:", items.length)
    console.log("[v0]   - Total mappings:", data.length)
    console.log("[v0] ========================")

    return NextResponse.json({ items, mappings: data })
  } catch (error: any) {
    console.error("[v0] Unexpected error in GET /api/fdd/item-mappings:", error)
    return NextResponse.json({ items: [], mappings: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const body = await request.json()
    const { franchise_slug, mappings } = body

    console.log("[v0] POST /api/fdd/item-mappings - Received:", { franchise_slug, mappingsCount: mappings?.length })

    if (!franchise_slug || !mappings || !Array.isArray(mappings)) {
      console.error("[v0] Invalid request body:", { franchise_slug, mappings })
      return NextResponse.json({ error: "franchise_slug and mappings array are required" }, { status: 400 })
    }

    const mappingsToUpsert = mappings.map((m: any) => ({
      franchise_slug,
      mapping_type: m.mapping_type || "item",
      item_number: m.item_number || null,
      label: m.label,
      page_number: m.page_number,
    }))

    const deduplicatedMappings = mappingsToUpsert.reduce((acc: any[], mapping: any) => {
      const isDuplicate = acc.some((existing) => {
        if (mapping.mapping_type === "item") {
          return (
            existing.franchise_slug === mapping.franchise_slug &&
            existing.mapping_type === mapping.mapping_type &&
            existing.item_number === mapping.item_number
          )
        } else {
          return (
            existing.franchise_slug === mapping.franchise_slug &&
            existing.mapping_type === mapping.mapping_type &&
            existing.label === mapping.label
          )
        }
      })

      if (!isDuplicate) {
        acc.push(mapping)
      }
      return acc
    }, [])

    console.log("[v0] Deduplicated mappings:", {
      original: mappingsToUpsert.length,
      deduplicated: deduplicatedMappings.length,
      removed: mappingsToUpsert.length - deduplicatedMappings.length,
    })

    const itemMappings = deduplicatedMappings.filter((m) => m.mapping_type === "item")
    const otherMappings = deduplicatedMappings.filter((m) => m.mapping_type !== "item")

    console.log("[v0] Split mappings:", {
      items: itemMappings.length,
      others: otherMappings.length,
    })

    let allData: any[] = []

    if (itemMappings.length > 0) {
      const { data: itemData, error: itemError } = await supabase
        .from("fdd_item_page_mappings")
        .upsert(itemMappings, {
          onConflict: "franchise_slug,mapping_type,item_number",
          ignoreDuplicates: false,
        })
        .select()

      if (itemError) {
        console.error("[v0] Error upserting items:", itemError)
        throw itemError
      }
      console.log("[v0] Successfully saved item mappings:", { count: itemData?.length })
      allData = [...allData, ...(itemData || [])]
    }

    if (otherMappings.length > 0) {
      const { data: otherData, error: otherError } = await supabase
        .from("fdd_item_page_mappings")
        .upsert(otherMappings, {
          onConflict: "franchise_slug,mapping_type,label",
          ignoreDuplicates: false,
        })
        .select()

      if (otherError) {
        console.error("[v0] Error upserting exhibits/quick_links:", otherError)
        throw otherError
      }
      console.log("[v0] Successfully saved exhibit/quick_link mappings:", { count: otherData?.length })
      allData = [...allData, ...(otherData || [])]
    }

    console.log("[v0] Successfully saved all mappings:", {
      total: allData.length,
      items: itemMappings.length,
      others: otherMappings.length,
    })

    return NextResponse.json({ success: true, mappings: allData })
  } catch (error) {
    console.error("[v0] Error saving item mappings:", error)
    return NextResponse.json(
      { error: "Failed to save item mappings", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
