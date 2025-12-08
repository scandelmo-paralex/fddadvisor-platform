import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
  }

  try {
    // Fetch the PDF from Supabase
    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: response.status })
    }

    // Get the PDF data
    const pdfData = await response.arrayBuffer()

    // Return the PDF with proper headers
    return new NextResponse(pdfData, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error) {
    console.error("[v0] PDF proxy error:", error)
    return NextResponse.json({ error: "Failed to proxy PDF" }, { status: 500 })
  }
}
