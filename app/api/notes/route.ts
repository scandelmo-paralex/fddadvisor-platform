import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch user's notes (optionally filtered by fdd_id)
export async function GET(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const fddId = searchParams.get("fdd_id")
    const franchiseId = searchParams.get("franchise_id")

    let query = supabase
      .from("user_notes")
      .select(`
        id,
        user_id,
        fdd_id,
        page_number,
        note_text,
        highlight_text,
        created_at,
        updated_at,
        fdds!inner (
          id,
          franchise_id,
          franchise_name
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (fddId) {
      query = query.eq("fdd_id", fddId)
    }

    if (franchiseId) {
      query = query.eq("fdds.franchise_id", franchiseId)
    }

    const { data: notes, error } = await query

    if (error) {
      console.error("[v0] Error fetching notes:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform to frontend format
    const transformedNotes =
      notes?.map((note) => ({
        id: note.id,
        userId: note.user_id,
        fddId: note.fdd_id,
        franchiseId: (note.fdds as any)?.franchise_id,
        franchiseName: (note.fdds as any)?.franchise_name,
        pageNumber: note.page_number,
        content: note.note_text,
        highlightText: note.highlight_text,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      })) || []

    return NextResponse.json({ notes: transformedNotes })
  } catch (error) {
    console.error("[v0] Notes GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new note
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { fddId, pageNumber, content, highlightText } = body

    if (!fddId || !content) {
      return NextResponse.json({ error: "fddId and content are required" }, { status: 400 })
    }

    const { data: note, error } = await supabase
      .from("user_notes")
      .insert({
        user_id: user.id,
        fdd_id: fddId,
        page_number: pageNumber || null,
        note_text: content,
        highlight_text: highlightText || null,
      })
      .select(`
        id,
        user_id,
        fdd_id,
        page_number,
        note_text,
        highlight_text,
        created_at,
        updated_at
      `)
      .single()

    if (error) {
      console.error("[v0] Error creating note:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      note: {
        id: note.id,
        userId: note.user_id,
        fddId: note.fdd_id,
        pageNumber: note.page_number,
        content: note.note_text,
        highlightText: note.highlight_text,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      },
    })
  } catch (error) {
    console.error("[v0] Notes POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
