# FDDHub Product Tour

A lightweight onboarding tour for the FDD Viewer using [Driver.js](https://driverjs.com/).

## Installation

First, install the Driver.js package:

```bash
npm install driver.js
```

## Usage

### Basic Usage (Auto-start for first-time users)

```tsx
import { FDDViewerTour } from "@/components/product-tour"

export default function FDDPage() {
  return (
    <div>
      <FDDViewer {...props} />
      <FDDViewerTour franchiseName="Drybar" />
    </div>
  )
}
```

### Manual Trigger (Replay Tour Button)

```tsx
import { FDDViewerTour, useFDDViewerTour } from "@/components/product-tour"
import { Button } from "@/components/ui/button"

export default function FDDPage() {
  const { startTour, forceShow, onTourComplete, hasSeenTour } = useFDDViewerTour()

  return (
    <div>
      <FDDViewer {...props} />
      
      {hasSeenTour && (
        <Button onClick={startTour} variant="ghost" size="sm">
          Replay Tour
        </Button>
      )}
      
      <FDDViewerTour 
        franchiseName="Drybar"
        autoStart={false}
        forceShow={forceShow}
        onComplete={onTourComplete}
      />
    </div>
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `autoStart` | `boolean` | `true` | Auto-start tour for first-time users |
| `forceShow` | `boolean` | `false` | Force show tour (overrides hasSeenTour) |
| `franchiseName` | `string` | `"this franchise"` | Personalize tour messages |
| `onComplete` | `() => void` | - | Callback when tour finishes |
| `onSkip` | `() => void` | - | Callback when user skips tour |

## Data Tour Attributes

The tour targets elements with `data-tour` attributes:

| Attribute | Element |
|-----------|---------|
| `data-tour="pdf-viewer"` | FDD Document tab |
| `data-tour="fdd-navigation"` | Navigation card (Items/Exhibits) |
| `data-tour="ai-chat-button"` | AI Assistant floating button |
| `data-tour="franchisescore-tab"` | FranchiseScore™ tab |
| `data-tour="notes-section"` | My Notes card |
| `data-tour="engagement-progress"` | Engagement Progress card |

## Tour Steps

1. **Welcome** - Introduction to the FDD Viewer
2. **FDD Document** - Explains PDF navigation
3. **Quick Navigation** - Shows Item/Exhibit dropdowns
4. **AI Assistant** - Highlights the AI chat button (key feature!)
5. **FranchiseScore™** - Explains the analysis tab
6. **Notes** - Shows note-taking feature
7. **Progress** - Engagement tracking
8. **Completion** - Final message with next steps

## Customization

### Resetting Tour State (for testing)

```tsx
const { resetTour } = useFDDViewerTour()

// Clear localStorage to show tour again
resetTour()
```

### Version Bump (force re-show after major UI changes)

Edit `TOUR_VERSION` in `fdd-viewer-tour.tsx`:

```tsx
const TOUR_VERSION = "1.1" // Was "1.0"
```

## Styling

The tour popover automatically inherits CSS variables from your theme:

- `--background`
- `--foreground`
- `--muted-foreground`
- `--border`
- `--primary`
- `--primary-foreground`
- `--accent`

Custom styles are injected inline and support both light and dark modes.

## Why Driver.js?

- **Zero monthly cost** - Unlike HelpHero ($55/mo) or Product Fruits ($79/mo)
- **Lightweight** - ~82KB minified
- **No external dependencies**
- **TypeScript support**
- **Works with Next.js 15 + React 19**
- **MIT licensed**
