/**
 * FTC Compliance Utilities
 * 
 * Per FTC Franchise Rule, prospective franchisees must wait 14 calendar days 
 * after receiving the FDD (evidenced by signing Item 23 receipt) before 
 * executing any franchise agreement or paying any fees.
 */

export interface SalesEligibilityStatus {
  isEligible: boolean
  daysRemaining: number
  eligibleDate: Date | null
  receiptSignedDate: Date | null
}

/**
 * Calculate sales eligibility based on Item 23 receipt signing date
 * 
 * @param receiptSignedAt - ISO date string when Item 23 receipt was signed
 * @returns SalesEligibilityStatus object
 */
export function calculateSalesEligibility(receiptSignedAt: string | null | undefined): SalesEligibilityStatus {
  // If no receipt signed, not eligible
  if (!receiptSignedAt) {
    return {
      isEligible: false,
      daysRemaining: -1, // -1 indicates receipt not signed yet
      eligibleDate: null,
      receiptSignedDate: null,
    }
  }

  const signedDate = new Date(receiptSignedAt)
  const now = new Date()
  
  // Calculate eligible date (14 days after signing)
  const eligibleDate = new Date(signedDate)
  eligibleDate.setDate(eligibleDate.getDate() + 14)
  
  // Calculate days remaining
  const msRemaining = eligibleDate.getTime() - now.getTime()
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24))
  
  return {
    isEligible: daysRemaining <= 0,
    daysRemaining: Math.max(0, daysRemaining),
    eligibleDate,
    receiptSignedDate: signedDate,
  }
}

/**
 * Format the sales eligibility status for display
 * 
 * @param status - SalesEligibilityStatus object
 * @returns Display string
 */
export function formatSalesEligibility(status: SalesEligibilityStatus): string {
  if (status.daysRemaining === -1) {
    return "Awaiting Receipt"
  }
  
  if (status.isEligible) {
    return "Eligible"
  }
  
  return `${status.daysRemaining}d remaining`
}
