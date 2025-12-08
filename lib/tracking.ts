export interface ViewingActivity {
  userId: string
  franchiseId: string
  viewedAt: string
  timeSpent: number // seconds
  sectionsViewed: string[]
  source: "fddadvisor" | "fddhub"
  invitedBy?: string // franchisor_id if user was invited to view a different franchise
}

export interface CompetitiveIntelligence {
  leadId: string
  primaryFranchiseId: string // The franchise they were invited to
  competitorViews: Array<{
    franchiseId: string
    franchiseName: string
    viewedAt: string
    timeSpent: number
    sectionsViewed: string[]
  }>
}

/**
 * Track when a lead views a franchise in FDDAdvisor
 * This creates competitive intelligence for franchisors
 */
export async function trackFranchiseView(activity: ViewingActivity) {
  // TODO: Implement API call to track viewing activity
  console.log("[v0] Tracking franchise view:", activity)

  // If user was invited to a different franchise, this is competitive intelligence
  if (activity.invitedBy && activity.source === "fddadvisor") {
    console.log("[v0] Competitive intelligence detected:", {
      lead: activity.userId,
      invitedTo: activity.invitedBy,
      alsoViewing: activity.franchiseId,
    })
  }

  // Store in database
  // await db.insert(viewing_activity).values(activity)
}

/**
 * Get competitive intelligence for a franchisor
 * Shows what other franchises their leads are researching
 */
export async function getCompetitiveIntelligence(franchisorId: string): Promise<CompetitiveIntelligence[]> {
  // TODO: Implement API call to fetch competitive intelligence
  console.log("[v0] Fetching competitive intelligence for franchisor:", franchisorId)

  // Query:
  // 1. Get all leads invited by this franchisor
  // 2. Find all FDDAdvisor views by those leads for OTHER franchises
  // 3. Aggregate by lead

  return []
}

/**
 * Track engagement metrics for FDD viewing
 */
export async function trackEngagement(
  userId: string,
  franchiseId: string,
  engagement: {
    timeSpent: number
    sectionsViewed: string[]
    questionsAsked: string[]
    notesCreated: number
  },
) {
  console.log("[v0] Tracking engagement:", { userId, franchiseId, engagement })

  // Update engagement metrics in database
  // await db.update(fdd_engagements).set(engagement).where(...)
}
