"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Palette, Save, Loader2, Video } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

interface WhiteLabelSettingsProps {
  franchiseId: string
  franchiseName: string
}

export function WhiteLabelSettings({ franchiseId, franchiseName }: WhiteLabelSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    primary_color: "#2563eb",
    accent_color: "#10b981",
    header_text: "",
    resources_video_url: "",
    resources_video_title: "",
    resources_video_description: "",
  })

  useEffect(() => {
    loadSettings()
  }, [franchiseId])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/white-label-settings/${franchiseId}`)
      if (response.ok) {
        const data = await response.json()
        // API returns settings directly, not wrapped in a 'settings' key
        if (data && data.franchise_id) {
          setSettings({
            primary_color: data.primary_color || "#2563eb",
            accent_color: data.accent_color || "#10b981",
            header_text: data.header_text || "",
            resources_video_url: data.resources_video_url || "",
            resources_video_title: data.resources_video_title || "",
            resources_video_description: data.resources_video_description || "",
          })
        }
      }
    } catch (error) {
      console.error("[v0] Failed to load white-label settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch(`/api/white-label-settings/${franchiseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      alert("Settings saved successfully!")
    } catch (error) {
      console.error("[v0] Failed to save white-label settings:", error)
      alert("Failed to save settings. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading settings...</span>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6 space-y-6">
      {/* Resources Video Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-2">
            <Video className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <h4 className="font-medium text-sm">Resources Tab Video</h4>
            <p className="text-xs text-muted-foreground">Customize the featured video shown to leads in the Resources tab</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>YouTube Video URL</Label>
          <Input
            placeholder="https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
            value={settings.resources_video_url}
            onChange={(e) => setSettings({ ...settings, resources_video_url: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Paste a YouTube URL (e.g., https://www.youtube.com/watch?v=abc123). Leave blank to use the default FDD guide video.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Video Title</Label>
          <Input
            placeholder="Welcome to Our Franchise"
            value={settings.resources_video_title}
            onChange={(e) => setSettings({ ...settings, resources_video_title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Video Description</Label>
          <Textarea
            placeholder="Learn about our franchise opportunity and what makes us different..."
            value={settings.resources_video_description}
            onChange={(e) => setSettings({ ...settings, resources_video_description: e.target.value })}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} className="bg-cta hover:bg-cta/90 text-cta-foreground gap-2">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
