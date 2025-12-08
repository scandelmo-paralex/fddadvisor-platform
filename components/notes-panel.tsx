"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Plus, Edit2, Trash2, Save, X, StickyNote } from "lucide-react"
import type { Note } from "@/lib/data"

interface NotesPanelProps {
  franchiseId: string
  notes: Note[]
  onAddNote: (franchiseId: string, title: string, content: string) => void
  onUpdateNote: (noteId: string, title: string, content: string) => void
  onDeleteNote: (noteId: string) => void
}

export function NotesPanel({ franchiseId, notes, onAddNote, onUpdateNote, onDeleteNote }: NotesPanelProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newContent, setNewContent] = useState("")
  const [editTitle, setEditTitle] = useState("")
  const [editContent, setEditContent] = useState("")

  const franchiseNotes = notes.filter((note) => note.franchiseId === franchiseId)

  const handleAdd = () => {
    if (newTitle.trim() && newContent.trim()) {
      onAddNote(franchiseId, newTitle, newContent)
      setNewTitle("")
      setNewContent("")
      setIsAdding(false)
    }
  }

  const handleEdit = (note: Note) => {
    setEditingId(note.id)
    setEditTitle(note.title)
    setEditContent(note.content)
  }

  const handleUpdate = (noteId: string) => {
    if (editTitle.trim() && editContent.trim()) {
      onUpdateNote(noteId, editTitle, editContent)
      setEditingId(null)
      setEditTitle("")
      setEditContent("")
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle("")
    setEditContent("")
  }

  const handleCancelAdd = () => {
    setIsAdding(false)
    setNewTitle("")
    setNewContent("")
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-cta" />
          <h2 className="text-lg font-bold">My Notes</h2>
          <span className="rounded-full bg-cta/10 px-2 py-0.5 text-xs font-medium text-cta">
            {franchiseNotes.length}
          </span>
        </div>
        {!isAdding && (
          <Button size="sm" onClick={() => setIsAdding(true)} className="bg-cta hover:bg-cta/90 text-cta-foreground">
            <Plus className="mr-1 h-4 w-4" />
            Add Note
          </Button>
        )}
      </div>

      {/* Add new note form */}
      {isAdding && (
        <Card className="mb-3 border-cta/30 bg-cta/5 p-3">
          <div className="space-y-2">
            <Input
              placeholder="Note title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border-cta/30 bg-background"
            />
            <Textarea
              placeholder="Add your thoughts, questions, or concerns..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              className="border-cta/30 bg-background"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAdd} className="bg-cta hover:bg-cta/90 text-cta-foreground">
                <Save className="mr-1 h-3 w-3" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelAdd}>
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Notes list */}
      <div className="space-y-2">
        {franchiseNotes.length === 0 && !isAdding && (
          <div className="py-8 text-center">
            <StickyNote className="mx-auto mb-2 h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No notes yet</p>
            <p className="text-xs text-muted-foreground">Add notes to track your thoughts and questions</p>
          </div>
        )}

        {franchiseNotes.map((note) => (
          <Card key={note.id} className="border-border/50 bg-card/50 p-3">
            {editingId === note.id ? (
              <div className="space-y-2">
                <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="border-cta/30" />
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="border-cta/30"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUpdate(note.id)}
                    className="bg-cta hover:bg-cta/90 text-cta-foreground"
                  >
                    <Save className="mr-1 h-3 w-3" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    <X className="mr-1 h-3 w-3" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-semibold text-sm">{note.title}</h3>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(note)}
                      className="h-7 w-7 p-0 hover:bg-cta/10 hover:text-cta"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteNote(note.id)}
                      className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(note.updatedAt).toLocaleDateString()} at{" "}
                  {new Date(note.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </>
            )}
          </Card>
        ))}
      </div>
    </Card>
  )
}
