"use client"

import { useState, useEffect } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerProps {
  pdfUrl?: string
  pdfPageUrls?: string[]
  franchiseName: string
  initialPage?: number
  targetItem?: number
  onFddTextLoaded?: (text: string) => void
  fddId?: string
}

export function PDFViewer({
  pdfUrl,
  pdfPageUrls,
  franchiseName,
  initialPage = 1,
  targetItem,
  onFddTextLoaded,
  fddId,
}: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [numPages, setNumPages] = useState<number>(0)
  const [zoom, setZoom] = useState(1.0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (initialPage !== currentPage) {
      setCurrentPage(initialPage)
      console.log("[v0] PDF Viewer navigating to page:", initialPage)
    }
  }, [initialPage])

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
    console.log("[v0] PDF loaded successfully, total pages:", numPages)
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 2.0))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1))
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, numPages))

  const isTextFile = pdfUrl?.endsWith(".txt")
  const isImage = pdfUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  const hasMultiPageImages = pdfPageUrls && pdfPageUrls.length > 0

  return (
    <div className="flex h-full flex-col">
      {/* PDF Header */}
      <div className="border-b bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold">Franchise Disclosure Document</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{franchiseName} • Updated Sept 2025</p>

        {/* PDF Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1 || isLoading}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} of {numPages || "..."}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === numPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom === 0.5}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom === 2.0}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-muted/30 p-4">
        <div className="flex justify-center">
          {pdfUrl && !isTextFile && !isImage && !hasMultiPageImages ? (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-8">
                  <p className="text-muted-foreground">Loading PDF...</p>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-8">
                  <p className="text-destructive">Failed to load PDF. Please try again.</p>
                </div>
              }
            >
              <Page pageNumber={currentPage} scale={zoom} renderTextLayer={true} renderAnnotationLayer={true} />
            </Document>
          ) : hasMultiPageImages ? (
            <img
              src={pdfPageUrls[currentPage - 1] || "/placeholder.svg"}
              alt={`${franchiseName} FDD Page ${currentPage}`}
              className="h-auto w-full object-contain shadow-lg"
              style={{ maxWidth: `${zoom * 100}%` }}
            />
          ) : isImage ? (
            <img
              src={pdfUrl || "/placeholder.svg"}
              alt={`${franchiseName} FDD`}
              className="h-auto w-full object-contain shadow-lg"
              style={{ maxWidth: `${zoom * 100}%` }}
            />
          ) : isTextFile ? (
            <Card className="mx-auto p-8 bg-white dark:bg-card" style={{ width: `${zoom * 100}%`, maxWidth: "900px" }}>
              <p className="text-sm text-muted-foreground">Text file preview not available</p>
            </Card>
          ) : (
            <Card className="mx-auto p-8">
              <p className="text-sm text-muted-foreground">No PDF available</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
