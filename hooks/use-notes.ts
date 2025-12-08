"use client"

import { useState, useEffect, useCallback } from "react"
import type { Note } from "@/lib/data"

interface UseNotesOptions {
  fddId?: string
  franchiseId?: string
}

export function useNotes({ fddId, franchiseId }: UseNotesOptions = {}) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (fddId) params.set("fdd_id", fddId)
      if (franchiseId) params.set("franchise_id", franchiseId)

      const response = await fetch(`/api/notes?${params.toString()}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to fetch notes")
      }

      const data = await response.json()
      setNotes(data.notes || [])
    } catch (err) {
      console.error("[v0] Error fetching notes:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch notes")
    } finally {
      setIsLoading(false)
    }
  }, [fddId, franchiseId])

  // Add note
  const addNote = useCallback(
    async (noteData: {
      fddId: string
      content: string
      pageNumber?: number
      highlightText?: string
    }) => {
      try {
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(noteData),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to create note")
        }

        const data = await response.json()
        setNotes((prev) => [data.note, ...prev])
        return data.note
      } catch (err) {
        console.error("[v0] Error creating note:", err)
        throw err
      }
    },
    [],
  )

  // Update note
  const updateNote = useCallback(
    async (
      noteId: string,
      updates: {
        content?: string
        pageNumber?: number
        highlightText?: string
      },
    ) => {
      try {
        const response = await fetch(`/api/notes/${noteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to update note")
        }

        const data = await response.json()
        setNotes((prev) => prev.map((n) => (n.id === noteId ? data.note : n)))
        return data.note
      } catch (err) {
        console.error("[v0] Error updating note:", err)
        throw err
      }
    },
    [],
  )

  // Delete note
  const deleteNote = useCallback(async (noteId: string) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to delete note")
      }

      setNotes((prev) => prev.filter((n) => n.id !== noteId))
    } catch (err) {
      console.error("[v0] Error deleting note:", err)
      throw err
    }
  }, [])

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  return {
    notes,
    isLoading,
    error,
    addNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  }
}
