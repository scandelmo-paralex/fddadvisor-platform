"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Upload, FileImage, X, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FDDUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  franchiseId: string
  franchiseName: string
  onUploadComplete: (urls: string[], pageMapping?: { [key: string]: number[] }) => void
}

export function FDDUploadModal({
  open,
  onOpenChange,
  franchiseId,
  franchiseName,
  onUploadComplete,
}: FDDUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      // Sort files by name to ensure correct page order
      selectedFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      setFiles(selectedFiles)
      setError(null)
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file")
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    try {
      console.log(`[v0] Uploading ${files.length} FDD pages for ${franchiseName}`)

      // Create FormData with all files
      const formData = new FormData()
      formData.append("franchiseId", franchiseId)

      files.forEach((file) => {
        formData.append("files", file)
      })

      // Upload to API route
      const response = await fetch("/api/upload-fdd-pages", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || "Upload failed")
      }

      const result = await response.json()
      console.log(`[v0] Successfully uploaded ${result.totalPages} pages`)

      // Create intelligent page mapping based on typical FDD structure
      const totalPages = result.totalPages
      const pageMapping = {
        "Item 5": [Math.min(10, totalPages), Math.min(11, totalPages)], // Fees
        "Item 6": [Math.min(12, totalPages), Math.min(13, totalPages)], // Investment
        "Item 7": [Math.min(14, totalPages), Math.min(15, totalPages), Math.min(16, totalPages)], // Initial investment
        "Item 19": [Math.floor(totalPages * 0.7), Math.floor(totalPages * 0.7) + 1, Math.floor(totalPages * 0.7) + 2], // Financial performance
      }

      // Extract URLs from the result
      const urls = result.pages.map((page: { url: string }) => page.url)

      onUploadComplete(urls, pageMapping)
      onOpenChange(false)
      setFiles([])
      setProgress(0)
    } catch (err) {
      console.error("[v0] Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload files")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload FDD Pages</DialogTitle>
          <DialogDescription>
            Upload all pages of the {franchiseName} FDD as PNG or JPG images. Files will be uploaded to Vercel Blob
            storage and used for AI-powered Vision analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info alert about Blob token */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Make sure the <code className="text-xs bg-muted px-1 py-0.5 rounded">BLOB_READ_WRITE_TOKEN</code>{" "}
              environment variable is set in your project settings.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="fdd-files">Select FDD Page Images</Label>
            <div className="flex items-center gap-2">
              <Input
                id="fdd-files"
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                multiple
                onChange={handleFileChange}
                disabled={uploading}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" disabled={uploading}>
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {files.length > 0 ? `${files.length} files selected` : "Select all pages (PNG or JPG)"}
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({files.length})</Label>
              <div className="max-h-[200px] space-y-1 overflow-y-auto rounded-md border p-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between rounded bg-muted px-2 py-1 text-sm">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      <span className="truncate">
                        Page {index + 1}: {file.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <Label>Upload Progress</Label>
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground">Uploading to Vercel Blob storage...</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button type="button" onClick={handleUpload} disabled={uploading || files.length === 0}>
            {uploading ? "Uploading..." : `Upload ${files.length} Page${files.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
