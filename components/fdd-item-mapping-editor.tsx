"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings, Save, Loader2 } from "lucide-react"

interface ItemMapping {
  item_number: number
  page_number: number
}

interface FDDItemMappingEditorProps {
  franchiseSlug: string
  franchiseName: string
}

export function FDDItemMappingEditor({ franchiseSlug, franchiseName }: FDDItemMappingEditorProps) {
  const [open, setOpen] = useState(false)
  const [mappings, setMappings] = useState<ItemMapping[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      loadMappings()
    }
  }, [open, franchiseSlug])

  const loadMappings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/fdd/item-mappings?franchise_slug=${franchiseSlug}`)
      const data = await response.json()

      if (data.mappings && data.mappings.length > 0) {
        setMappings(data.mappings)
      } else {
        // Initialize with default 23 items
        setMappings(
          Array.from({ length: 23 }, (_, i) => ({
            item_number: i + 1,
            page_number: 1,
          })),
        )
      }
    } catch (error) {
      console.error("[v0] Error loading mappings:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveMappings = async () => {
    setSaving(true)
    try {
      const response = await fetch("/api/fdd/item-mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchise_slug: franchiseSlug,
          mappings,
        }),
      })

      if (response.ok) {
        setOpen(false)
      } else {
        console.error("[v0] Error saving mappings")
      }
    } catch (error) {
      console.error("[v0] Error saving mappings:", error)
    } finally {
      setSaving(false)
    }
  }

  const updatePageNumber = (itemNumber: number, pageNumber: number) => {
    setMappings((prev) => prev.map((m) => (m.item_number === itemNumber ? { ...m, page_number: pageNumber } : m)))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Edit Item Mappings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit FDD Item Page Mappings</DialogTitle>
          <DialogDescription>Configure which page each FDD Item appears on for {franchiseName}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {mappings.map((mapping) => (
                <div key={mapping.item_number} className="space-y-2">
                  <Label htmlFor={`item-${mapping.item_number}`}>Item {mapping.item_number}</Label>
                  <Input
                    id={`item-${mapping.item_number}`}
                    type="number"
                    min="1"
                    value={mapping.page_number}
                    onChange={(e) => updatePageNumber(mapping.item_number, Number.parseInt(e.target.value) || 1)}
                    placeholder="Page #"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveMappings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Mappings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
