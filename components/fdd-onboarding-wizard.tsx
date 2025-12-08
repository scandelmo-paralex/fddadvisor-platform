"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Copy,
  MapPin,
  FileCheck,
  X,
} from "lucide-react"

interface FDDOnboardingWizardProps {
  onClose: () => void
  onComplete: (fddData: FDDData) => void
}

interface FDDData {
  brandName: string
  fddPdfUrl: string
  fddTextUrl: string
  fddPageUrls: string[]
  fddPageOffset: number
  fddPageMapping: { [key: string]: number[] }
  tocPageNumbers: { [key: string]: number }
}

export function FDDOnboardingWizard({ onClose, onComplete }: FDDOnboardingWizardProps) {
  const [step, setStep] = useState(1)
  const [brandName, setBrandName] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [textFile, setTextFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [extractedTOC, setExtractedTOC] = useState<{ [key: string]: number }>({})
  const [pageOffset, setPageOffset] = useState(8)
  const [manualMappings, setManualMappings] = useState<{ [key: string]: number }>({})
  const [generatedCode, setGeneratedCode] = useState("")
  const [showPreview, setShowPreview] = useState(false)

  const totalSteps = 5

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleTextUpload = (file: File) => {
    setTextFile(file)
    // Simulate TOC extraction
    const mockTOC = {
      "Item 1": 1,
      "Item 2": 2,
      "Item 3": 2,
      "Item 4": 2,
      "Item 5": 3,
      "Item 6": 4,
      "Item 7": 8,
      "Item 8": 12,
      "Item 9": 14,
      "Item 10": 15,
      "Item 11": 16,
      "Item 12": 24,
      "Item 13": 25,
      "Item 14": 27,
      "Item 15": 28,
      "Item 16": 29,
      "Item 17": 30,
      "Item 18": 34,
      "Item 19": 34,
      "Item 20": 37,
      "Item 21": 39,
      "Item 22": 39,
      "Item 23": 40,
    }
    setExtractedTOC(mockTOC)
  }

  const handleGenerateCode = () => {
    const fddData: FDDData = {
      brandName,
      fddPdfUrl: `/fdds/${brandName.toLowerCase().replace(/\s+/g, "-")}-fdd-2025.txt`,
      fddTextUrl: `/fdds/${brandName.toLowerCase().replace(/\s+/g, "-")}-fdd-2025.txt`,
      fddPageUrls: imageFiles.map((_, i) => `https://blob.vercel-storage.com/${brandName}-page-${i + 1}.png`),
      fddPageOffset: pageOffset,
      fddPageMapping: Object.entries({ ...extractedTOC, ...manualMappings }).reduce(
        (acc, [item, page]) => {
          acc[item] = [page]
          return acc
        },
        {} as { [key: string]: number[] },
      ),
      tocPageNumbers: { ...extractedTOC, ...manualMappings },
    }

    const code = `{
  id: "${Date.now()}",
  name: "${brandName}",
  logo: "/placeholder.svg?height=40&width=120",
  description: "${brandName} franchise opportunity",
  investment: "$XXX,XXX - $XXX,XXX",
  franchiseScore: 0,
  fddPdfUrl: "${fddData.fddPdfUrl}",
  fddPageUrls: [
    ${fddData.fddPageUrls.map((url) => `"${url}"`).join(",\n    ")}
  ],
  fddPageOffset: ${fddData.fddPageOffset},
  fddPageMapping: {
    ${Object.entries(fddData.fddPageMapping)
      .map(([item, pages]) => `"${item}": [${pages.join(", ")}]`)
      .join(",\n    ")}
  }
}`

    setGeneratedCode(code)
    onComplete(fddData)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">FDD Onboarding Wizard</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Step {step} of {totalSteps}: {getStepTitle(step)}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 flex gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  i < step ? "bg-cta" : i === step - 1 ? "bg-cta/50" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Brand Information</h3>
                <p className="text-sm text-muted-foreground">Enter the franchise brand name for this FDD</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Brand Name *</label>
                <input
                  type="text"
                  className="w-full p-3 bg-muted/50 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-cta"
                  placeholder="e.g., Daisy, Subway, Drybar"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>

              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-blue-600">What You'll Need</p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>FDD PDF file (original document)</li>
                      <li>Extracted text file (.txt format)</li>
                      <li>Individual page images (PNG format, one per page)</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Upload FDD Files</h3>
                <p className="text-sm text-muted-foreground">Upload the PDF, extracted text, and page images</p>
              </div>

              {/* PDF Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">FDD PDF File *</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-3">
                  {pdfFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">{pdfFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <div className="rounded-full bg-muted p-3">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Upload FDD PDF</p>
                        <p className="text-xs text-muted-foreground">PDF file, max 50MB</p>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files && setPdfFile(e.target.files[0])}
                    className="hidden"
                    id="pdf-upload"
                  />
                  <label htmlFor="pdf-upload">
                    <Button variant="outline" size="sm" className="cursor-pointer bg-transparent" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Text Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Extracted Text File *</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-3">
                  {textFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">{textFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <div className="rounded-full bg-muted p-3">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Upload Text File</p>
                        <p className="text-xs text-muted-foreground">.txt file with extracted FDD content</p>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".txt"
                    onChange={(e) => e.target.files && handleTextUpload(e.target.files[0])}
                    className="hidden"
                    id="text-upload"
                  />
                  <label htmlFor="text-upload">
                    <Button variant="outline" size="sm" className="cursor-pointer bg-transparent" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* Images Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Page Images *</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center space-y-3">
                  {imageFiles.length > 0 ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">{imageFiles.length} pages uploaded</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-center">
                        <div className="rounded-full bg-muted p-3">
                          <Upload className="h-6 w-6 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Upload Page Images</p>
                        <p className="text-xs text-muted-foreground">PNG files, one per page</p>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".png"
                    multiple
                    onChange={(e) => e.target.files && setImageFiles(Array.from(e.target.files))}
                    className="hidden"
                    id="images-upload"
                  />
                  <label htmlFor="images-upload">
                    <Button variant="outline" size="sm" className="cursor-pointer bg-transparent" asChild>
                      <span>Choose Files</span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Verify Table of Contents</h3>
                <p className="text-sm text-muted-foreground">
                  Review the extracted page numbers and correct any errors
                </p>
              </div>

              <Card className="p-4 bg-amber-500/10 border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-600">Important</p>
                    <p className="text-sm text-muted-foreground">
                      Some FDDs have incorrect page numbers in their Table of Contents. Verify each Item's page number
                      against the actual PDF.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                {Object.entries(extractedTOC).map(([item, page]) => (
                  <div key={item} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item}</p>
                      <p className="text-xs text-muted-foreground">Extracted: Page {page}</p>
                    </div>
                    <input
                      type="number"
                      className="w-20 p-2 text-sm bg-background rounded border border-border focus:outline-none focus:ring-2 focus:ring-cta"
                      value={manualMappings[item] ?? page}
                      onChange={(e) =>
                        setManualMappings({
                          ...manualMappings,
                          [item]: Number.parseInt(e.target.value) || page,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Calculate Page Offset</h3>
                <p className="text-sm text-muted-foreground">
                  Determine the number of preliminary pages before the FDD content starts
                </p>
              </div>

              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-600">How to Calculate Page Offset</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Open the actual PDF and find where Item 1 starts</li>
                      <li>Note the actual PDF page number (e.g., page 9)</li>
                      <li>The TOC says Item 1 is on "page 1" (FDD internal numbering)</li>
                      <li>Page Offset = (Actual PDF page) - 1 = 9 - 1 = 8</li>
                    </ol>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <label className="text-sm font-medium">Page Offset *</label>
                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    className="w-32 p-3 bg-muted/50 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-cta"
                    value={pageOffset}
                    onChange={(e) => setPageOffset(Number.parseInt(e.target.value) || 0)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of preliminary pages (cover + TOC) before FDD content
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <p className="text-sm font-medium">Example Calculation:</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• If Item 1 starts on actual PDF page 9</p>
                  <p>• And TOC says Item 1 is on "page 1"</p>
                  <p>• Then Page Offset = 9 - 1 = 8</p>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Review & Generate Code</h3>
                <p className="text-sm text-muted-foreground">
                  Review your configuration and generate the franchise data object
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Brand Name</p>
                  <p className="font-semibold">{brandName}</p>
                </Card>
                <Card className="p-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Page Offset</p>
                  <p className="font-semibold">{pageOffset} pages</p>
                </Card>
                <Card className="p-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Pages</p>
                  <p className="font-semibold">{imageFiles.length} pages</p>
                </Card>
                <Card className="p-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Manual Corrections</p>
                  <p className="font-semibold">{Object.keys(manualMappings).length} Items</p>
                </Card>
              </div>

              {generatedCode && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Generated Franchise Data</label>
                    <Button onClick={copyToClipboard} size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Copy className="h-4 w-4" />
                      Copy Code
                    </Button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto rounded-lg border p-4 bg-muted/50">
                    <pre className="text-xs font-mono">
                      <code>{generatedCode}</code>
                    </pre>
                  </div>
                </div>
              )}

              <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-emerald-600">Next Steps</p>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Click "Generate Code" to create the franchise data object</li>
                      <li>Copy the generated code using the "Copy Code" button</li>
                      <li>
                        Open <code className="text-xs bg-muted px-1 py-0.5 rounded">lib/data.ts</code>
                      </li>
                      <li>Add the franchise object to the franchises array</li>
                      <li>Save the file and test the FDD viewer</li>
                    </ol>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border p-6 flex items-center justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 1} className="gap-2 bg-transparent">
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex gap-2">
            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed(step, brandName, pdfFile, textFile, imageFiles)}
                className="gap-2 bg-cta hover:bg-cta/90 text-cta-foreground"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                {!generatedCode && (
                  <Button onClick={handleGenerateCode} className="gap-2 bg-cta hover:bg-cta/90 text-cta-foreground">
                    <FileCheck className="h-4 w-4" />
                    Generate Code
                  </Button>
                )}
                {generatedCode && (
                  <Button onClick={onClose} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

function getStepTitle(step: number): string {
  const titles = ["Brand Information", "Upload Files", "Verify TOC", "Calculate Offset", "Review & Generate"]
  return titles[step - 1] || ""
}

function canProceed(
  step: number,
  brandName: string,
  pdfFile: File | null,
  textFile: File | null,
  imageFiles: File[],
): boolean {
  switch (step) {
    case 1:
      return brandName.trim().length > 0
    case 2:
      return pdfFile !== null && textFile !== null && imageFiles.length > 0
    case 3:
    case 4:
      return true
    default:
      return false
  }
}
