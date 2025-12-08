"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface Mapping {
  id: string
  item_type: string
  item_number: number | null
  item_label: string
  page_number: number
  status: string
}

export default function VerifyMappingsPage() {
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMappings = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/fdd/item-mappings?franchise_slug=drybar")
      if (!response.ok) throw new Error("Failed to fetch mappings")
      const data = await response.json()
      console.log("[v0] Full API response:", data)
      console.log("[v0] Mappings array:", data.mappings)
      console.log("[v0] Sample mapping:", data.mappings?.[0])
      setMappings(data.mappings || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMappings()
  }, [])

  const items = mappings.filter((m) => m.item_type === "item" || (m as any).mapping_type === "item")
  const exhibits = mappings.filter((m) => m.item_type === "exhibit" || (m as any).mapping_type === "exhibit")
  const quickLinks = mappings.filter((m) => m.item_type === "quick_link" || (m as any).mapping_type === "quick_link")

  const getStatusIcon = (status: string) => {
    if (status === "confirmed") return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (status === "needs_review") return <AlertCircle className="h-4 w-4 text-yellow-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Drybar Mapping Verification</h1>
          <Button onClick={fetchMappings} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Items 1-23</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{items.length} / 23</p>
              <p className="text-sm text-muted-foreground">
                {items.filter((i) => i.status === "confirmed").length} confirmed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exhibits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{exhibits.length}</p>
              <p className="text-sm text-muted-foreground">
                {exhibits.filter((e) => e.status === "confirmed").length} confirmed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{quickLinks.length}</p>
              <p className="text-sm text-muted-foreground">
                {quickLinks.filter((q) => q.status === "confirmed").length} confirmed
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Mappings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["item", "exhibit", "quick_link"].map((type) => {
                const typeMappings = mappings.filter((m) => m.item_type === type || (m as any).mapping_type === type)
                if (typeMappings.length === 0) return null

                return (
                  <div key={type}>
                    <h3 className="font-semibold mb-2 capitalize">{type}s</h3>
                    <div className="space-y-1">
                      {typeMappings.map((mapping) => (
                        <div key={mapping.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(mapping.status)}
                            <span className="font-medium">{mapping.item_label}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Page {mapping.page_number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
