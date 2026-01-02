"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, ArrowLeft, ExternalLink, Eye, Layers } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { PipelineStageManager } from "@/components/pipeline-stage-manager"

interface Franchise {
  id: string
  name: string
  slug: string
  industry: string
  logo_url?: string | null
  company_name?: string
  fdd_pdf_url?: string
}

export default function CompanySettingsPage() {
  const router = useRouter()
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const [companyName, setCompanyName] = useState("")

  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        const response = await fetch("/api/franchises")
        if (!response.ok) throw new Error("Failed to fetch franchises")
        const data = await response.json()
        setFranchises(data)

        // Get company name from first franchise
        if (data.length > 0 && data[0].company_name) {
          setCompanyName(data[0].company_name)
        }
      } catch (error) {
        console.error("Error fetching franchises:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFranchises()
  }, [])

  const handleViewFDD = (slug: string) => {
    router.push(`/fdd/${slug}`)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Button variant="ghost" onClick={() => router.push("/hub/leads")} className="gap-2 mb-4 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Leads
            </Button>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cta/10 p-3">
                <Building2 className="h-6 w-6 text-cta" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{companyName || "Company Settings"}</h1>
                <p className="text-muted-foreground">Manage your franchise brands, pipeline stages, and settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="brands" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="brands" className="gap-2">
              <Building2 className="h-4 w-4" />
              Brands
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-2">
              <Layers className="h-4 w-4" />
              Pipeline Stages
            </TabsTrigger>
          </TabsList>

          {/* Brands Tab */}
          <TabsContent value="brands" className="mt-6">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Your Franchise Brands</h2>
                <p className="text-sm text-muted-foreground">{franchises.length} active brands</p>
              </div>

              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-6 animate-pulse">
                      <div className="h-20 bg-muted rounded-lg mb-4" />
                      <div className="h-6 bg-muted rounded mb-2" />
                      <div className="h-4 bg-muted rounded w-3/4" />
                    </Card>
                  ))}
                </div>
              ) : franchises.length === 0 ? (
                <Card className="p-12 text-center">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Franchises Found</h3>
                  <p className="text-sm text-muted-foreground">Contact support to add your franchise brands</p>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {franchises.map((franchise) => (
                    <Card
                      key={franchise.id}
                      className="p-6 hover:shadow-lg transition-all border-border/50 hover:border-cta/50"
                    >
                      {/* Franchise Logo */}
                      <div className="flex items-center justify-center h-20 mb-4 bg-muted/30 rounded-lg p-4">
                        {franchise.logo_url ? (
                          <Image
                            src={franchise.logo_url || "/placeholder.svg"}
                            alt={franchise.name}
                            width={120}
                            height={60}
                            className="max-h-full max-w-full object-contain"
                          />
                        ) : (
                          <Building2 className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>

                      {/* Franchise Info */}
                      <div className="space-y-3">
                        <div>
                          <h3 className="font-semibold text-lg">{franchise.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{franchise.industry}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 pt-2">
                          <Button
                            onClick={() => handleViewFDD(franchise.slug)}
                            className="w-full bg-cta hover:bg-cta/90 text-cta-foreground gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View FDD
                          </Button>
                          {franchise.fdd_pdf_url && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(franchise.fdd_pdf_url!, "_blank")}
                              className="w-full gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Pipeline Stages Tab */}
          <TabsContent value="pipeline" className="mt-6">
            <Card className="p-6">
              <PipelineStageManager />
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className="p-6 bg-cta/5 border-cta/20">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-cta/10 p-2">
              <Building2 className="h-5 w-5 text-cta" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">FDDHub White-Label Platform</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Each franchise brand has its own FDD viewer experience where invited buyers can review documents,
                receive personalized branding, and sign Item 23 receipts. All engagement is tracked in your leads
                dashboard.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
