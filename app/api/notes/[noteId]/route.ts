import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - Fetch a single note
export async function GET(request: Request, { params }: { params: Promise<{ noteId: string }> }) {
  try {
    const { noteId } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: note, error } = await supabase
      .from("user_notes")
      .select("*")
      .eq("id", noteId)
      .eq("user_id", user.id)
      .single()

    if (error || !note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
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
    console.error("[v0] Note GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Update a note
export async function PATCH(request: Request, { params }: { params: Promise<{ noteId: string }> }) {
  try {
    const { noteId } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content, pageNumber, highlightText } = body

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    if (content !== undefined) updateData.note_text = content
    if (pageNumber !== undefined) updateData.page_number = pageNumber
    if (highlightText !== undefined) updateData.highlight_text = highlightText

    const { data: note, error } = await supabase
      .from("user_notes")
      .update(updateData)
      .eq("id", noteId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating note:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
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
    console.error("[v0] Note PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete a note
export async function DELETE(request: Request, { params }: { params: Promise<{ noteId: string }> }) {
  try {
    const { noteId } = await params
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase.from("user_notes").delete().eq("id", noteId).eq("user_id", user.id)

    if (error) {
      console.error("[v0] Error deleting note:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Note DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
