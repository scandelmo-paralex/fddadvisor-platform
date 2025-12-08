"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, CheckCircle2, Clock, AlertCircle, Map } from "lucide-react"

interface FranchisorFDD {
  id: string
  franchisorName: string
  brandName: string
  franchiseId: string
  uploadedAt: string
  status: "needs_mapping" | "mapping_in_progress" | "mapping_complete"
  mappedBy?: string
  mappedAt?: string
}

export default function AdminFDDProcessingPage() {
  const [fdds] = useState<FranchisorFDD[]>([
    {
      id: "drybar-fdd-2025",
      franchisorName: "Drybar Holdings LLC",
      brandName: "Drybar",
      franchiseId: "96deab51-6be3-41b4-b478-5de164823cdd",
      uploadedAt: "2025-01-20",
      status: "needs_mapping",
    },
    {
      id: "amazing-lash-fdd-2025",
      franchisorName: "Amazing Lash Studio LLC",
      brandName: "Amazing Lash",
      franchiseId: "amazing-lash-id",
      uploadedAt: "2025-01-22",
      status: "needs_mapping",
    },
    {
      id: "radiant-waxing-fdd-2025",
      franchisorName: "Radiant Waxing LLC",
      brandName: "Radiant Waxing",
      franchiseId: "radiant-waxing-id",
      uploadedAt: "2025-01-22",
      status: "needs_mapping",
    },
    {
      id: "fitness-together-fdd-2025",
      franchisorName: "Fitness Together LLC",
      brandName: "Fitness Together",
      franchiseId: "fitness-together-id",
      uploadedAt: "2025-01-22",
      status: "needs_mapping",
    },
    {
      id: "elements-massage-fdd-2025",
      franchisorName: "Elements Massage LLC",
      brandName: "Elements Massage",
      franchiseId: "elements-massage-id",
      uploadedAt: "2025-01-22",
      status: "needs_mapping",
    },
  ])

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">FDD Page Mapping Admin</h1>
        <p className="text-muted-foreground">
          Manually map FDD items, exhibits, and quick links to their correct page numbers
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{fdds.filter((f) => f.status === "needs_mapping").length}</p>
              <p className="text-sm text-muted-foreground">Needs Mapping</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Map className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{fdds.filter((f) => f.status === "mapping_in_progress").length}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{fdds.filter((f) => f.status === "mapping_complete").length}</p>
              <p className="text-sm text-muted-foreground">Mapping Complete</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">WellBiz Brands - FDD Page Mappings</h2>

          <div className="space-y-3">
            {fdds.map((fdd) => (
              <div key={fdd.id} className="p-4 rounded-lg border border-border bg-muted/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{fdd.brandName}</p>
                        <p className="text-sm text-muted-foreground">{fdd.franchisorName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Uploaded: {fdd.uploadedAt}</span>
                      {fdd.status === "mapping_complete" && fdd.mappedAt && <span>Mapped: {fdd.mappedAt}</span>}
                    </div>

                    {fdd.status === "mapping_complete" && fdd.mappedBy && (
                      <p className="text-xs text-muted-foreground">Mapped by: {fdd.mappedBy}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        fdd.status === "mapping_complete"
                          ? "default"
                          : fdd.status === "mapping_in_progress"
                            ? "secondary"
                            : "outline"
                      }
                      className={
                        fdd.status === "mapping_complete"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : fdd.status === "mapping_in_progress"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }
                    >
                      {fdd.status === "mapping_complete" ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Complete
                        </>
                      ) : fdd.status === "mapping_in_progress" ? (
                        <>
                          <Map className="mr-1 h-3 w-3" />
                          In Progress
                        </>
                      ) : (
                        <>
                          <Clock className="mr-1 h-3 w-3" />
                          Needs Mapping
                        </>
                      )}
                    </Badge>

                    <Button variant="default" size="sm" asChild className="bg-cta hover:bg-cta/90 text-cta-foreground">
                      <a href={`/admin/franchise/${fdd.franchiseId}/item-mapping`}>
                        <Map className="mr-2 h-4 w-4" />
                        Page Mapping Tool
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm font-medium text-blue-600">Page Mapping Instructions</p>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Click "Page Mapping Tool" for the brand you want to map</li>
              <li>Use the Items tab to map all 23 FDD items to their correct page numbers</li>
              <li>Use the Exhibits tab to add and map exhibits (Financial Statements, Franchise Agreement, etc.)</li>
              <li>Use the Quick Links tab to map key sections (Cover, TOC, Item 19, Financials, Exhibits)</li>
              <li>Click "Save All Mappings" when complete</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  )
}
