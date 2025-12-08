import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { franchiseId, buyerId } = await request.json()

    const { data: franchise } = await supabase
      .from("franchises")
      .select("name, franchisor_id, franchisors!inner(name, email)")
      .eq("id", franchiseId)
      .single()

    const { data: buyer } = await supabase
      .from("buyer_profiles")
      .select("user_id, users!inner(email, full_name)")
      .eq("id", buyerId)
      .single()

    if (!franchise || !buyer) {
      return NextResponse.json({ error: "Franchise or buyer not found" }, { status: 404 })
    }

    const docusealResponse = await fetch("https://api.docuseal.com/submissions", {
      method: "POST",
      headers: {
        "X-Auth-Token": process.env.DOCUSEAL_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        template_id: Number.parseInt(process.env.DOCUSEAL_ITEM23_TEMPLATE_ID!),
        send_email: false,
        submitters: [
          {
            role: "Buyer",
            email: buyer.users.email,
            name: buyer.users.full_name || buyer.users.email,
            metadata: {
              franchise_id: franchiseId,
              buyer_id: buyerId,
              franchise_name: franchise.name,
            },
          },
        ],
      }),
    })

    if (!docusealResponse.ok) {
      const error = await docusealResponse.text()
      console.error("[v0] DocuSeal API error:", error)
      return NextResponse.json({ error: "Failed to create signature request" }, { status: 500 })
    }

    const submission = await docusealResponse.json()

    return NextResponse.json({
      submissionId: submission.id,
      embedUrl: submission.submitters[0].embed_src,
      slug: submission.submitters[0].slug,
    })
  } catch (error) {
    console.error("[v0] Error creating DocuSeal submission:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
