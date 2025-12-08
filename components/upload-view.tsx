"use client"

import { useState } from "react"
import { Upload, FileText, Shield, Zap, CheckCircle2, Search, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function UploadView() {
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState("")
  const [progress, setProgress] = useState(0)
  const [franchiseName, setFranchiseName] = useState("")
  const [searchStep, setSearchStep] = useState(true)

  const handleSearch = () => {
    if (franchiseName.trim()) {
      setSearchStep(false)
    }
  }

  const handleFileSelect = () => {
    setFileName("Subway_FDD_2024.pdf")
    setUploading(true)

    // Simulate upload progress
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += 10
      setProgress(currentProgress)
      if (currentProgress >= 100) {
        clearInterval(interval)
        setTimeout(() => setUploading(false), 500)
      }
    }, 300)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Hero */}
      <div className="text-center">
        <h1 className="mb-3 text-4xl font-bold">Upload Your FDD</h1>
        <p className="text-lg text-muted-foreground">Get instant AI-powered analysis and insights</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>FDD Upload Coming Soon</strong> - This feature requires extensive PDF processing, AI analysis, and
          vector database integration. For now, please browse our existing library of 400+ analyzed FDDs.
        </AlertDescription>
      </Alert>
      {/* </CHANGE> */}

      {searchStep ? (
        <Card className="p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Search className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-xl font-bold">First, check if we already have this FDD</h3>
              <p className="text-sm text-muted-foreground">
                We have 400+ franchises already analyzed. Search to see if yours is included.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="franchise-search">Franchise Name</Label>
                <Input
                  id="franchise-search"
                  placeholder="e.g., Subway, McDonald's, Anytime Fitness"
                  value={franchiseName}
                  onChange={(e) => setFranchiseName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>

              <Button onClick={handleSearch} disabled={!franchiseName.trim()} className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Search Our Library
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                If we don't have your franchise, you'll be able to request it for processing
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Upload Zone - Disabled for now */}
          <Card className="p-12 opacity-50 pointer-events-none">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="text-6xl">📄</div>
              <h3 className="text-xl font-bold">Drop your FDD here</h3>
              <p className="text-sm text-muted-foreground">or click to browse your files</p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium"
                onClick={handleFileSelect}
                disabled
              >
                <Upload className="mr-2 h-5 w-5" />
                Choose File (Coming Soon)
              </Button>
              <p className="text-xs text-muted-foreground">Supports PDF, DOC, DOCX up to 50MB</p>
            </div>

            {fileName && (
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
                  <FileText className="h-5 w-5 text-accent" />
                  <span className="flex-1 font-medium">{fileName}</span>
                  {!uploading && <CheckCircle2 className="h-5 w-5 text-accent" />}
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Analyzing...</span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}
              </div>
            )}
          </Card>

          <div className="text-center">
            <Button variant="ghost" onClick={() => setSearchStep(true)}>
              ← Back to Search
            </Button>
          </div>
        </>
      )}
      {/* </CHANGE> */}

      {/* Features */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="rounded-lg bg-accent/10 p-3">
              <Zap className="h-6 w-6 text-accent" />
            </div>
          </div>
          <h3 className="mb-2 font-bold">AI Analysis</h3>
          <p className="text-sm text-muted-foreground">Advanced AI extracts key insights automatically</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="rounded-lg bg-accent/10 p-3">
              <CheckCircle2 className="h-6 w-6 text-accent" />
            </div>
          </div>
          <h3 className="mb-2 font-bold">Instant Results</h3>
          <p className="text-sm text-muted-foreground">Get comprehensive analysis in seconds</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="mb-3 flex justify-center">
            <div className="rounded-lg bg-accent/10 p-3">
              <Shield className="h-6 w-6 text-accent" />
            </div>
          </div>
          <h3 className="mb-2 font-bold">Secure & Private</h3>
          <p className="text-sm text-muted-foreground">Your documents are encrypted and protected</p>
        </Card>
      </div>
    </div>
  )
}
