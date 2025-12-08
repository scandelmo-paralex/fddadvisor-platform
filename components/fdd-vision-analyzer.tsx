"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Loader2, FileText, DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react"

interface VisionAnalysisResult {
  itemNumber: number
  itemTitle: string
  tables: Array<{
    title: string
    headers: string[]
    rows: string[][]
    footnotes: string[]
  }>
  keyFindings: string[]
  disclaimers: string[]
}

interface FDDVisionAnalyzerProps {
  franchiseName: string
  imageUrl: string
  analysisType?: "full" | "item19" | "fees" | "investment"
}

export function FDDVisionAnalyzer({ franchiseName, imageUrl, analysisType = "full" }: FDDVisionAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<VisionAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const fullImageUrl = imageUrl.startsWith("http") ? imageUrl : `${window.location.origin}${imageUrl}`

      console.log("[v0] Starting vision analysis:", { franchiseName, imageUrl: fullImageUrl, analysisType })

      const response = await fetch("/api/fdd/analyze-vision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: fullImageUrl,
          franchiseName,
          analysisType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Analysis failed: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Vision analysis complete:", data)

      setResult(data.data)
    } catch (err) {
      console.error("[v0] Vision analysis error:", err)
      setError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getAnalysisIcon = () => {
    switch (analysisType) {
      case "item19":
        return <TrendingUp className="h-5 w-5" />
      case "fees":
        return <DollarSign className="h-5 w-5" />
      case "investment":
        return <DollarSign className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getAnalysisTitle = () => {
    switch (analysisType) {
      case "item19":
        return "Item 19 Financial Performance"
      case "fees":
        return "Fee Structure Analysis"
      case "investment":
        return "Investment Breakdown"
      default:
        return "Full Document Analysis"
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-cta/10 p-2">
              <Eye className="h-5 w-5 text-cta" />
            </div>
            <div>
              <h3 className="font-semibold">{getAnalysisTitle()}</h3>
              <p className="text-sm text-muted-foreground">AI Vision Analysis</p>
            </div>
          </div>
          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-cta hover:bg-cta/90 text-cta-foreground">
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Analyze Document
              </>
            )}
          </Button>
        </div>

        {/* Preview Image */}
        <div className="mb-4 rounded-lg border border-border overflow-hidden">
          <img src={imageUrl || "/placeholder.svg"} alt={`${franchiseName} FDD`} className="w-full h-auto" />
        </div>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Analysis Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Results */}
      {result && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold">Analysis Complete</h3>
          </div>

          {/* Item Info */}
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              Item {result.itemNumber}
            </Badge>
            <span className="font-medium">{result.itemTitle}</span>
          </div>

          {/* Tables */}
          {result.tables.map((table, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="font-medium text-sm">{table.title}</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted/50">
                      {table.headers.map((header, i) => (
                        <th key={i} className="border border-border px-3 py-2 text-left text-sm font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        {row.map((cell, j) => (
                          <td key={j} className="border border-border px-3 py-2 text-sm">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {table.footnotes.length > 0 && (
                <div className="space-y-1">
                  {table.footnotes.map((footnote, i) => (
                    <p key={i} className="text-xs text-muted-foreground italic">
                      {footnote}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Key Findings */}
          {result.keyFindings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Key Findings</h4>
              <ul className="space-y-1">
                {result.keyFindings.map((finding, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-cta mt-1">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimers */}
          {result.disclaimers.length > 0 && (
            <div className="space-y-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Important Disclaimers
              </h4>
              <ul className="space-y-1">
                {result.disclaimers.map((disclaimer, i) => (
                  <li key={i} className="text-xs text-muted-foreground">
                    {disclaimer}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
