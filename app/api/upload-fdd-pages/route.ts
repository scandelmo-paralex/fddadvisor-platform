import { put } from "@vercel/blob"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]
    const franchiseId = formData.get("franchiseId") as string

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    if (!franchiseId) {
      return NextResponse.json({ error: "Franchise ID is required" }, { status: 400 })
    }

    console.log(`[v0] Uploading ${files.length} FDD pages for franchise: ${franchiseId}`)

    // Upload all files to Vercel Blob
    const uploadPromises = files.map(async (file, index) => {
      const filename = `fdd/${franchiseId}/page-${String(index + 1).padStart(2, "0")}.png`
      console.log(`[v0] Uploading file: ${filename}`)

      const blob = await put(filename, file, {
        access: "public",
      })

      return {
        url: blob.url,
        pageNumber: index + 1,
        filename: file.name,
      }
    })

    const uploadedPages = await Promise.all(uploadPromises)

    console.log(`[v0] Successfully uploaded ${uploadedPages.length} pages to Blob storage`)

    return NextResponse.json({
      success: true,
      pages: uploadedPages,
      totalPages: uploadedPages.length,
    })
  } catch (error) {
    console.error("[v0] Upload error:", error)
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
