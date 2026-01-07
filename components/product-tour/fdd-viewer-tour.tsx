"use client"

import { useEffect, useState, useCallback } from "react"

// Driver.js types (inline to avoid TypeScript errors if package not yet installed)
interface DriveStep {
  element?: string
  popover: {
    title: string
    description: string
    side?: "top" | "right" | "bottom" | "left" | "over"
    align?: "start" | "center" | "end"
  }
}

interface FDDViewerTourProps {
  /**
   * Whether the tour should auto-start when component mounts
   * Default: true (starts automatically for first-time users)
   */
  autoStart?: boolean
  
  /**
   * Callback fired when tour completes or is dismissed
   */
  onComplete?: () => void
  
  /**
   * Callback fired when user skips the tour
   */
  onSkip?: () => void
  
  /**
   * Force show the tour even if user has seen it before
   * Useful for "Replay Tour" buttons
   */
  forceShow?: boolean
  
  /**
   * The franchise name to personalize tour messages
   */
  franchiseName?: string
}

// LocalStorage key for tracking if user has seen the tour
const TOUR_SEEN_KEY = "fddhub_fdd_viewer_tour_seen"
const TOUR_VERSION = "1.0" // Bump this to force re-show tour after major UI changes

/**
 * Product tour for the FDD Viewer page
 * Highlights key features like AI Assistant, navigation, and notes
 * 
 * Uses Driver.js for lightweight, dependency-free tours
 * 
 * @example
 * // Basic usage - auto-starts for first-time users
 * <FDDViewerTour franchiseName="Drybar" />
 * 
 * @example
 * // Manual trigger with replay button
 * const [showTour, setShowTour] = useState(false)
 * <Button onClick={() => setShowTour(true)}>Show Tour</Button>
 * <FDDViewerTour autoStart={false} forceShow={showTour} onComplete={() => setShowTour(false)} />
 */
export function FDDViewerTour({
  autoStart = true,
  onComplete,
  onSkip,
  forceShow = false,
  franchiseName = "this franchise",
}: FDDViewerTourProps) {
  const [isReady, setIsReady] = useState(false)
  const [driverLoaded, setDriverLoaded] = useState(false)

  // Check if user has already seen the tour
  const hasSeenTour = useCallback(() => {
    if (typeof window === "undefined") return true
    const seen = localStorage.getItem(TOUR_SEEN_KEY)
    if (!seen) return false
    try {
      const data = JSON.parse(seen)
      return data.version === TOUR_VERSION
    } catch {
      return false
    }
  }, [])

  // Mark tour as seen
  const markTourSeen = useCallback(() => {
    if (typeof window === "undefined") return
    localStorage.setItem(
      TOUR_SEEN_KEY,
      JSON.stringify({
        version: TOUR_VERSION,
        seenAt: new Date().toISOString(),
      })
    )
  }, [])

  // Define tour steps
  const getTourSteps = useCallback((): DriveStep[] => {
    return [
      {
        popover: {
          title: "👋 Welcome to the FDD Viewer!",
          description: `Let's take a quick tour of the key features that will help you evaluate ${franchiseName}. This will only take about 30 seconds.`,
          side: "over",
          align: "center",
        },
      },
      {
        element: '[data-tour="pdf-viewer"]',
        popover: {
          title: "📄 FDD Document",
          description: "The full Franchise Disclosure Document is displayed here. Use the page controls at the top to navigate, zoom in/out, or jump to specific pages.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="fdd-navigation"]',
        popover: {
          title: "🧭 Quick Navigation",
          description: "Jump directly to any of the 23 FDD Items or Exhibits using these dropdowns. No more endless scrolling!",
          side: "left",
          align: "start",
        },
      },
      {
        element: '[data-tour="ai-chat-button"]',
        popover: {
          title: "🤖 AI Assistant - Your Research Partner",
          description: "This is your AI-powered research assistant! Click here to ask questions about the FDD. It can explain complex terms, summarize sections, and help you understand the franchise opportunity. Try asking: \"What are the total investment costs?\"",
          side: "top",
          align: "end",
        },
      },
      {
        element: '[data-tour="franchisescore-tab"]',
        popover: {
          title: "📊 FranchiseScore™",
          description: "Switch to this tab to see an independent analysis of the franchise across 4 key dimensions: Financial Transparency, System Strength, Franchisee Support, and Business Foundation.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: '[data-tour="notes-section"]',
        popover: {
          title: "📝 Your Notes",
          description: "Take notes as you review the FDD. Your notes are saved automatically and linked to specific pages for easy reference later.",
          side: "left",
          align: "start",
        },
      },
      {
        element: '[data-tour="engagement-progress"]',
        popover: {
          title: "📈 Your Progress",
          description: "Track your review progress here. We recommend spending at least 15 minutes reviewing the FDD and asking the AI assistant questions before making any decisions.",
          side: "left",
          align: "start",
        },
      },
      {
        popover: {
          title: "🎉 You're All Set!",
          description: "That's the tour! Remember: take your time, ask questions using the AI assistant, and consult with professional advisors before making any investment decisions.",
          side: "over",
          align: "center",
        },
      },
    ]
  }, [franchiseName])

  // Load Driver.js dynamically
  useEffect(() => {
    if (typeof window === "undefined") return
    
    // Dynamically import driver.js
    import("driver.js").then((module) => {
      // Import the CSS
      import("driver.js/dist/driver.css")
      setDriverLoaded(true)
    }).catch((error) => {
      console.error("[Tour] Failed to load driver.js:", error)
    })
  }, [])

  // Wait for DOM to be ready
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 1500) // Give components time to mount and render

    return () => clearTimeout(timer)
  }, [])

  // Initialize and run the tour
  useEffect(() => {
    if (!isReady || !driverLoaded) return
    
    // Don't run if user has seen it (unless forced)
    if (!forceShow && hasSeenTour()) return
    
    // Don't auto-start if autoStart is false and not forced
    if (!autoStart && !forceShow) return

    // Check if key elements exist before starting tour
    const aiChatButton = document.querySelector('[data-tour="ai-chat-button"]')
    if (!aiChatButton) {
      console.log("[Tour] AI chat button not found, waiting...")
      return
    }

    // Dynamically import and run the tour
    import("driver.js").then(({ driver }) => {
      const steps = getTourSteps()
      
      // Filter out steps where the element doesn't exist
      const validSteps = steps.filter((step) => {
        if (!step.element) return true // Welcome/completion steps always show
        const el = document.querySelector(step.element as string)
        if (!el) {
          console.log(`[Tour] Element not found: ${step.element}`)
        }
        return !!el
      })

      if (validSteps.length < 3) {
        console.log("[Tour] Not enough valid steps, skipping tour")
        return
      }

      const driverObj = driver({
        showProgress: true,
        showButtons: ["next", "previous", "close"],
        steps: validSteps,
        nextBtnText: "Next →",
        prevBtnText: "← Back",
        doneBtnText: "Done ✓",
        progressText: "{{current}} of {{total}}",
        popoverClass: "fddhub-tour-popover",
        overlayColor: "rgba(0, 0, 0, 0.6)",
        stagePadding: 8,
        stageRadius: 8,
        animate: true,
        allowClose: true,
        disableActiveInteraction: false,
        onCloseClick: () => {
          markTourSeen()
          driverObj.destroy()
          onSkip?.()
        },
        onDestroyStarted: () => {
          markTourSeen()
        },
        onDestroyed: () => {
          onComplete?.()
        },
      })
      
      // Small delay to ensure UI is fully rendered
      const startTimer = setTimeout(() => {
        driverObj.drive()
      }, 500)

      return () => {
        clearTimeout(startTimer)
        driverObj.destroy()
      }
    })
  }, [isReady, driverLoaded, autoStart, forceShow, hasSeenTour, getTourSteps, markTourSeen, onComplete, onSkip])

  // Inject custom styles for the tour popover
  useEffect(() => {
    if (typeof window === "undefined") return

    const styleId = "fddhub-tour-styles"
    if (document.getElementById(styleId)) return

    const style = document.createElement("style")
    style.id = styleId
    style.textContent = `
      .fddhub-tour-popover {
        background-color: white !important;
        color: #1e293b !important;
        border: 1px solid #e2e8f0 !important;
        border-radius: 12px !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 
                    0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
        padding: 0 !important;
        max-width: 360px !important;
      }

      .fddhub-tour-popover .driver-popover-title {
        font-size: 1rem !important;
        font-weight: 600 !important;
        color: #1e293b !important;
        padding: 16px 16px 8px 16px !important;
        margin: 0 !important;
        line-height: 1.4 !important;
      }

      .fddhub-tour-popover .driver-popover-description {
        font-size: 0.875rem !important;
        color: #475569 !important;
        padding: 0 16px 16px 16px !important;
        margin: 0 !important;
        line-height: 1.6 !important;
      }

      .fddhub-tour-popover .driver-popover-progress-text {
        font-size: 0.75rem !important;
        color: #64748b !important;
        padding: 0 16px !important;
      }

      .fddhub-tour-popover .driver-popover-footer {
        padding: 12px 16px 16px 16px !important;
        display: flex !important;
        gap: 8px !important;
        justify-content: flex-end !important;
        align-items: center !important;
        border-top: 1px solid #e2e8f0 !important;
        margin-top: 8px !important;
        background-color: white !important;
      }

      .fddhub-tour-popover .driver-popover-footer button {
        font-size: 0.875rem !important;
        font-weight: 500 !important;
        padding: 8px 16px !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        transition: all 0.15s ease !important;
        border: none !important;
        line-height: 1 !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
        text-rendering: optimizeLegibility !important;
      }

      .fddhub-tour-popover .driver-popover-prev-btn {
        background-color: transparent !important;
        color: #64748b !important;
      }

      .fddhub-tour-popover .driver-popover-prev-btn:hover {
        background-color: #f1f5f9 !important;
        color: #1e293b !important;
      }

      .fddhub-tour-popover .driver-popover-next-btn {
        background-color: #2563eb !important;
        color: white !important;
        font-weight: 500 !important;
        -webkit-font-smoothing: antialiased !important;
        -moz-osx-font-smoothing: grayscale !important;
      }

      .fddhub-tour-popover .driver-popover-next-btn:hover {
        background-color: #1d4ed8 !important;
      }

      .fddhub-tour-popover .driver-popover-close-btn {
        position: absolute !important;
        top: 12px !important;
        right: 12px !important;
        width: 24px !important;
        height: 24px !important;
        padding: 0 !important;
        background: transparent !important;
        border: none !important;
        color: #64748b !important;
        cursor: pointer !important;
        border-radius: 4px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 18px !important;
        line-height: 1 !important;
      }

      .fddhub-tour-popover .driver-popover-close-btn:hover {
        background-color: #f1f5f9 !important;
        color: #1e293b !important;
      }

      .driver-active-element {
        z-index: 10001 !important;
      }

      .fddhub-tour-popover {
        animation: tourFadeIn 0.2s ease-out;
      }

      @keyframes tourFadeIn {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 640px) {
        .fddhub-tour-popover {
          max-width: calc(100vw - 32px) !important;
          margin: 0 16px !important;
        }
        
        .fddhub-tour-popover .driver-popover-title {
          font-size: 0.9375rem !important;
          padding: 14px 14px 6px 14px !important;
        }
        
        .fddhub-tour-popover .driver-popover-description {
          font-size: 0.8125rem !important;
          padding: 0 14px 14px 14px !important;
        }
        
        .fddhub-tour-popover .driver-popover-footer {
          padding: 10px 14px 14px 14px !important;
        }
        
        .fddhub-tour-popover .driver-popover-footer button {
          padding: 6px 12px !important;
          font-size: 0.8125rem !important;
        }
      }
    `
    document.head.appendChild(style)

    return () => {
      const existingStyle = document.getElementById(styleId)
      if (existingStyle) {
        existingStyle.remove()
      }
    }
  }, [])

  // This component doesn't render anything visible
  return null
}

/**
 * Hook to manually control the tour
 * 
 * @example
 * const { startTour, resetTour, hasSeenTour } = useFDDViewerTour()
 * 
 * <Button onClick={startTour}>Replay Tour</Button>
 */
export function useFDDViewerTour() {
  const [forceShow, setForceShow] = useState(false)

  const hasSeenTour = useCallback(() => {
    if (typeof window === "undefined") return true
    const seen = localStorage.getItem(TOUR_SEEN_KEY)
    if (!seen) return false
    try {
      const data = JSON.parse(seen)
      return data.version === TOUR_VERSION
    } catch {
      return false
    }
  }, [])

  const startTour = useCallback(() => {
    setForceShow(true)
  }, [])

  const resetTour = useCallback(() => {
    if (typeof window === "undefined") return
    localStorage.removeItem(TOUR_SEEN_KEY)
  }, [])

  const onTourComplete = useCallback(() => {
    setForceShow(false)
  }, [])

  return {
    startTour,
    resetTour,
    hasSeenTour: hasSeenTour(),
    forceShow,
    onTourComplete,
  }
}

export default FDDViewerTour
