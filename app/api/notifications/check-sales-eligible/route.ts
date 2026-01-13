import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

/**
 * API endpoint to check for leads that have become sales-eligible (14 days since receipt signed)
 * 
 * This can be called:
 * 1. Via a cron job (e.g., Vercel Cron or external scheduler)
 * 2. Manually from an admin panel
 * 3. On franchisor dashboard load
 * 
 * GET /api/notifications/check-sales-eligible
 * POST /api/notifications/check-sales-eligible (with optional franchisor_id filter)
 */

export async function GET(request: Request) {
  return checkSalesEligible()
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const franchisor_id = body.franchisor_id
    return checkSalesEligible(franchisor_id)
  } catch (error) {
    return checkSalesEligible()
  }
}

async function checkSalesEligible(franchisor_id?: string) {
  try {
    const supabase = createServiceRoleClient()
    
    // Calculate the date 14 days ago
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const cutoffDate = fourteenDaysAgo.toISOString()

    console.log("[Notifications] Checking for sales-eligible leads (receipt signed before:", cutoffDate, ")")

    // Find leads that:
    // 1. Have signed the receipt (receipt_signed_at is not null)
    // 2. Signed the receipt 14+ days ago
    // 3. Haven't already been notified about being sales-eligible
    let query = supabase
      .from("lead_fdd_access")
      .select(`
        id,
        invitation_id,
        receipt_signed_at,
        lead_invitations!inner (
          id,
          lead_name,
          lead_email,
          franchisor_id,
          franchise_id,
          franchises!inner (
            name
          ),
          franchisor_profiles!inner (
            user_id,
            company_name
          )
        )
      `)
      .not("receipt_signed_at", "is", null)
      .lte("receipt_signed_at", cutoffDate)

    const { data: eligibleLeads, error } = await query

    if (error) {
      console.error("[Notifications] Error fetching eligible leads:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!eligibleLeads || eligibleLeads.length === 0) {
      console.log("[Notifications] No newly sales-eligible leads found")
      return NextResponse.json({ 
        success: true, 
        message: "No newly sales-eligible leads found",
        notified: 0 
      })
    }

    console.log("[Notifications] Found", eligibleLeads.length, "potentially sales-eligible leads")

    let notifiedCount = 0
    const errors: string[] = []

    for (const access of eligibleLeads) {
      try {
        const invitation = access.lead_invitations as any
        if (!invitation) continue

        const franchisor_user_id = invitation.franchisor_profiles?.user_id
        if (!franchisor_user_id) continue

        // Filter by franchisor_id if provided
        if (franchisor_id && invitation.franchisor_id !== franchisor_id) {
          continue
        }

        const lead_name = invitation.lead_name || invitation.lead_email
        const franchise_name = invitation.franchises?.name || "your franchise"

        // Check if we already sent this notification
        const { data: existingNotification } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", franchisor_user_id)
          .eq("type", "sales_eligible")
          .contains("data", { invitation_id: invitation.id })
          .limit(1)
          .maybeSingle()

        if (existingNotification) {
          console.log("[Notifications] Already notified for invitation:", invitation.id)
          continue
        }

        // Calculate days since receipt signed
        const receiptDate = new Date(access.receipt_signed_at!)
        const daysSinceSigned = Math.floor((Date.now() - receiptDate.getTime()) / (1000 * 60 * 60 * 24))

        // Create the notification
        const { error: notifyError } = await supabase.rpc('create_notification', {
          p_user_id: franchisor_user_id,
          p_type: 'sales_eligible',
          p_title: `✅ ${lead_name} is Sales Eligible!`,
          p_message: `The 14-day FTC disclosure period has passed for ${lead_name}. They can now sign the ${franchise_name} franchise agreement.`,
          p_data: {
            invitation_id: invitation.id,
            lead_name,
            lead_email: invitation.lead_email,
            franchise_id: invitation.franchise_id,
            franchise_name,
            receipt_signed_at: access.receipt_signed_at,
            days_since_signed: daysSinceSigned
          },
          p_franchisor_profile_id: invitation.franchisor_id
        })

        if (notifyError) {
          console.error("[Notifications] Error creating notification for lead:", invitation.id, notifyError)
          errors.push(`Lead ${invitation.id}: ${notifyError.message}`)
        } else {
          console.log("[Notifications] Created sales-eligible notification for:", lead_name)
          notifiedCount++
        }
      } catch (leadError: any) {
        console.error("[Notifications] Error processing lead:", leadError)
        errors.push(leadError.message)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${eligibleLeads.length} leads, notified ${notifiedCount}`,
      checked: eligibleLeads.length,
      notified: notifiedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error("[Notifications] check-sales-eligible error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
