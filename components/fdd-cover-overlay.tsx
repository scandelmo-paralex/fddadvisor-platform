"use client"

interface FDDCoverOverlayProps {
  coverImageUrl: string
  franchiseName: string
  onDismiss?: () => void
  width?: number
}

export function FDDCoverOverlay({ coverImageUrl, franchiseName, onDismiss, width }: FDDCoverOverlayProps) {
  const overlayWidth = width || (typeof window !== "undefined" ? Math.min(window.innerWidth * 0.5, 750) : 750)
  // Standard letter page aspect ratio (8.5" x 11")
  const overlayHeight = overlayWidth * (11 / 8.5)

  return (
    <div
      className="absolute top-0 left-0 z-10 bg-white overflow-hidden"
      onClick={onDismiss}
      style={{
        width: overlayWidth,
        height: overlayHeight,
        pointerEvents: onDismiss ? "auto" : "none",
        cursor: onDismiss ? "pointer" : "default",
      }}
    >
      <img
        src={coverImageUrl || "/placeholder.svg"}
        alt={`${franchiseName} FDD Cover Page`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "fill",
        }}
      />
    </div>
  )
}
