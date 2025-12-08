export interface VerificationStatus {
  isComplete: boolean
  isExpired: boolean
  daysUntilExpiration?: number
  status: "complete" | "expired" | "incomplete"
}

export function checkVerificationStatus(verifiedAt?: string, expiresAt?: string): VerificationStatus {
  if (!verifiedAt || !expiresAt) {
    return {
      isComplete: false,
      isExpired: false,
      status: "incomplete",
    }
  }

  const now = new Date()
  const expirationDate = new Date(expiresAt)
  const isExpired = now > expirationDate

  if (isExpired) {
    return {
      isComplete: true,
      isExpired: true,
      status: "expired",
    }
  }

  const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return {
    isComplete: true,
    isExpired: false,
    daysUntilExpiration,
    status: "complete",
  }
}

export function getVerificationStatusColor(status: "complete" | "expired" | "incomplete"): string {
  switch (status) {
    case "complete":
      return "text-emerald-600"
    case "expired":
      return "text-red-600"
    case "incomplete":
      return "text-amber-600"
  }
}

export function getVerificationStatusBadge(status: "complete" | "expired" | "incomplete"): string {
  switch (status) {
    case "complete":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "expired":
      return "bg-red-100 text-red-700 border-red-200"
    case "incomplete":
      return "bg-amber-100 text-amber-700 border-amber-200"
  }
}
