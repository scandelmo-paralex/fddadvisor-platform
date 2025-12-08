import { NextResponse } from "next/server"
import { list } from "@vercel/blob"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const prefix = searchParams.get("prefix") || ""

    console.log("[v0] Listing blobs with prefix:", prefix || "(all blobs)")

    const { blobs } = await list({
      ...(prefix && { prefix }),
    })

    console.log("[v0] Found blobs:", blobs.length)

    // Sort by pathname to ensure correct page order
    const sortedBlobs = blobs.sort((a, b) => a.pathname.localeCompare(b.pathname))

    const urls = sortedBlobs.map((blob) => blob.url)

    return NextResponse.json({
      urls,
      count: urls.length,
      blobs: sortedBlobs.map((b) => ({ url: b.url, pathname: b.pathname })),
    })
  } catch (error) {
    console.error("[v0] Error listing blobs:", error)
    return NextResponse.json({ error: "Failed to list blobs" }, { status: 500 })
  }
}
