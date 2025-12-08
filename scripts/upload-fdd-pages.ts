// Script to upload FDD page images to Vercel Blob storage
import { put } from "@vercel/blob"

interface UploadResult {
  pageNumber: number
  url: string
}

async function uploadFDDPages(files: File[], franchiseName: string): Promise<UploadResult[]> {
  console.log(`[v0] Starting upload of ${files.length} pages for ${franchiseName}`)

  const results: UploadResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const pageNumber = i + 1

    try {
      // Upload to Blob with a structured path
      const blob = await put(
        `fdd-pages/${franchiseName.toLowerCase().replace(/\s+/g, "-")}/page-${pageNumber}.png`,
        file,
        {
          access: "public",
          addRandomSuffix: false,
        },
      )

      results.push({
        pageNumber,
        url: blob.url,
      })

      console.log(`[v0] Uploaded page ${pageNumber}: ${blob.url}`)
    } catch (error) {
      console.error(`[v0] Failed to upload page ${pageNumber}:`, error)
      throw error
    }
  }

  console.log(`[v0] Successfully uploaded ${results.length} pages`)
  return results
}

// Example usage - you'll call this from a UI component
export async function uploadDaisyFDDPages(files: File[]) {
  const results = await uploadFDDPages(files, "Daisy")

  // Return the URLs in order
  return results.sort((a, b) => a.pageNumber - b.pageNumber).map((r) => r.url)
}
