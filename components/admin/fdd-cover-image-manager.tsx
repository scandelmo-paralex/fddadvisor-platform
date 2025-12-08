"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, Loader2 } from "lucide-react"
import Image from "next/image"
import { put } from "@vercel/blob"

interface Franchise {
  id: string
  name: string
  slug: string
  logo_url: string | null
  cover_image_url: string | null
}

interface FDDCoverImageManagerProps {
  franchises: Franchise[]
}

export function FDDCoverImageManager({ franchises }: FDDCoverImageManagerProps) {
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [franchiseImages, setFranchiseImages] = useState<Record<string, string>>(
    Object.fromEntries(franchises.map((f) => [f.id, f.cover_image_url || ""])),
  )
  const { toast } = useToast()

  const handleFileUpload = async (franchiseId: string, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive",
      })
      return
    }

    setUploadingId(franchiseId)

    try {
      // Upload to Vercel Blob
      const blob = await put(`fdd-covers/${franchiseId}-${Date.now()}.${file.name.split(".").pop()}`, file, {
        access: "public",
      })

      // Update database
      const response = await fetch("/api/admin/update-cover-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchiseId,
          coverImageUrl: blob.url,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update database")
      }

      setFranchiseImages((prev) => ({ ...prev, [franchiseId]: blob.url }))

      toast({
        title: "Cover image updated",
        description: "The FDD cover image has been successfully uploaded.",
      })
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading the cover image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingId(null)
    }
  }

  const handleRemoveCover = async (franchiseId: string) => {
    setUploadingId(franchiseId)

    try {
      const response = await fetch("/api/admin/update-cover-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchiseId,
          coverImageUrl: null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update database")
      }

      setFranchiseImages((prev) => ({ ...prev, [franchiseId]: "" }))

      toast({
        title: "Cover image removed",
        description: "The FDD cover image has been removed.",
      })
    } catch (error) {
      console.error("Remove error:", error)
      toast({
        title: "Remove failed",
        description: "There was an error removing the cover image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {franchises.map((franchise) => (
        <Card key={franchise.id}>
          <CardHeader>
            <div className="flex items-center gap-3">
              {franchise.logo_url && (
                <div className="h-12 w-12 relative rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={franchise.logo_url || "/placeholder.svg"}
                    alt={franchise.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <CardTitle>{franchise.name}</CardTitle>
                <CardDescription className="text-xs">/{franchise.slug}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {franchiseImages[franchise.id] ? (
              <div className="space-y-4">
                <div className="relative aspect-[8.5/11] bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={franchiseImages[franchise.id] || "/placeholder.svg"}
                    alt={`${franchise.name} cover`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <Label htmlFor={`upload-${franchise.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent"
                      disabled={uploadingId === franchise.id}
                      asChild
                    >
                      <span>
                        {uploadingId === franchise.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Replace
                          </>
                        )}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id={`upload-${franchise.id}`}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(franchise.id, file)
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveCover(franchise.id)}
                    disabled={uploadingId === franchise.id}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Label htmlFor={`upload-${franchise.id}`}>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary cursor-pointer transition-colors">
                    {uploadingId === franchise.id ? (
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload cover image</p>
                      </>
                    )}
                  </div>
                </Label>
                <Input
                  id={`upload-${franchise.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(franchise.id, file)
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
