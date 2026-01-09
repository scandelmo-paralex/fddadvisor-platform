import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import {
  DEFAULT_SCORING_WEIGHTS,
  DEFAULT_TEMPERATURE_THRESHOLDS,
  DEFAULT_IDEAL_CANDIDATE_CONFIG,
  validateScoringWeights,
  validateTemperatureThresholds,
  type ScoringWeights,
  type TemperatureThresholds,
  type IdealCandidateConfig
} from "@/lib/lead-scoring"

// =============================================================================
// GET - Fetch white-label settings for a franchise
// =============================================================================

export async function GET(request: Request, { params }: { params: Promise<{ franchiseId: string }> }) {
  try {
    const supabase = await createServerClient()
    const { franchiseId } = await params

    // Get white-label settings for franchise
    const { data: settings, error } = await supabase
      .from("white_label_settings")
      .select("*")
      .eq("franchise_id", franchiseId)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Return default settings if none exist
    if (!settings) {
      return NextResponse.json({
        franchise_id: franchiseId,
        // Legacy fields (kept for compatibility)
        primary_color: "#3B82F6",
        accent_color: "#1E40AF",
        // Resources tab
        resources_video_url: null,
        resources_video_title: null,
        resources_video_description: null,
        // New scoring customization fields
        scoring_weights: DEFAULT_SCORING_WEIGHTS,
        temperature_thresholds: DEFAULT_TEMPERATURE_THRESHOLDS,
        ideal_candidate_config: DEFAULT_IDEAL_CANDIDATE_CONFIG,
      })
    }

    // Return settings with defaults for any missing new fields
    return NextResponse.json({
      ...settings,
      scoring_weights: settings.scoring_weights || DEFAULT_SCORING_WEIGHTS,
      temperature_thresholds: settings.temperature_thresholds || DEFAULT_TEMPERATURE_THRESHOLDS,
      ideal_candidate_config: settings.ideal_candidate_config || DEFAULT_IDEAL_CANDIDATE_CONFIG,
    })
  } catch (error) {
    console.error("[white-label-settings] GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// =============================================================================
// PUT - Update white-label settings for a franchise
// =============================================================================

export async function PUT(request: Request, { params }: { params: Promise<{ franchiseId: string }> }) {
  try {
    const supabase = await createServerClient()
    const { franchiseId } = await params
    const body = await request.json()

    console.log("[white-label-settings] PUT - franchiseId:", franchiseId)

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[white-label-settings] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[white-label-settings] User ID:", user.id)

    // Get franchisor profile
    const { data: profile, error: profileError } = await supabase
      .from("franchisor_profiles")
      .select("id, is_admin")
      .eq("user_id", user.id)
      .single()

    console.log("[white-label-settings] Profile:", profile, "Error:", profileError)

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Verify franchise ownership OR admin access
    let hasAccess = false
    
    const { data: franchise, error: franchiseError } = await supabase
      .from("franchises")
      .select("id, franchisor_id")
      .eq("id", franchiseId)
      .single()

    console.log("[white-label-settings] Franchise lookup:", franchise, "Error:", franchiseError)

    if (franchise) {
      // Allow if admin OR if franchisor_id matches profile.id
      hasAccess = profile.is_admin || franchise.franchisor_id === profile.id
    }

    console.log("[white-label-settings] hasAccess:", hasAccess)

    if (!hasAccess) {
      return NextResponse.json({ error: "Franchise not found or unauthorized" }, { status: 403 })
    }

    // ==========================================================================
    // VALIDATION
    // ==========================================================================

    // Validate scoring weights if provided
    if (body.scoring_weights) {
      const weightsValidation = validateScoringWeights(body.scoring_weights as ScoringWeights)
      if (!weightsValidation.valid) {
        return NextResponse.json({ error: weightsValidation.error }, { status: 400 })
      }
    }

    // Validate temperature thresholds if provided
    if (body.temperature_thresholds) {
      const thresholdsValidation = validateTemperatureThresholds(body.temperature_thresholds as TemperatureThresholds)
      if (!thresholdsValidation.valid) {
        return NextResponse.json({ error: thresholdsValidation.error }, { status: 400 })
      }
    }

    // ==========================================================================
    // UPSERT SETTINGS
    // ==========================================================================

    const { data: settings, error } = await supabase
      .from("white_label_settings")
      .upsert(
        {
          franchise_id: franchiseId,
          franchisor_id: profile.id,
          // Legacy fields (keep for compatibility but may be unused)
          logo_url: body.logo_url || null,
          primary_color: body.primary_color || "#3B82F6",
          accent_color: body.accent_color || "#1E40AF",
          header_text: body.header_text || null,
          contact_name: body.contact_name || null,
          contact_email: body.contact_email || null,
          contact_phone: body.contact_phone || null,
          // Resources tab
          resources_video_url: body.resources_video_url || null,
          resources_video_title: body.resources_video_title || null,
          resources_video_description: body.resources_video_description || null,
          // NEW: Scoring customization
          scoring_weights: body.scoring_weights || DEFAULT_SCORING_WEIGHTS,
          temperature_thresholds: body.temperature_thresholds || DEFAULT_TEMPERATURE_THRESHOLDS,
          ideal_candidate_config: body.ideal_candidate_config || DEFAULT_IDEAL_CANDIDATE_CONFIG,
        },
        {
          onConflict: "franchise_id",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("[white-label-settings] Upsert error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[white-label-settings] Settings saved successfully")

    return NextResponse.json(settings)
  } catch (error) {
    console.error("[white-label-settings] PUT error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
