# Hooks Directory

> Custom React hooks for FDDHub and FDDAdvisor

## Overview

This directory contains reusable React hooks that encapsulate common functionality.

## Available Hooks

### `use-mobile.ts`
Detects mobile viewport for responsive behavior.

```typescript
import { useMobile } from "@/hooks/use-mobile"

function MyComponent() {
  const isMobile = useMobile()
  
  return isMobile ? <MobileView /> : <DesktopView />
}
```

### `use-notes.ts`
Manages user notes for FDD viewing.

```typescript
import { useNotes } from "@/hooks/use-notes"

function NotesPanel({ franchiseId }: { franchiseId: string }) {
  const { 
    notes, 
    addNote, 
    updateNote, 
    deleteNote, 
    isLoading 
  } = useNotes(franchiseId)
  
  // Use notes...
}
```

### `use-toast.ts`
Toast notification system.

```typescript
import { useToast } from "@/hooks/use-toast"

function MyComponent() {
  const { toast } = useToast()
  
  const handleAction = () => {
    toast({
      title: "Success",
      description: "Action completed",
    })
  }
}
```

## Usage Pattern

Hooks are imported from `@/hooks/`:

```typescript
import { useNotes } from "@/hooks/use-notes"
import { useMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"
```

## Notes on shadcn/ui Hooks

Some hooks are also available in `components/ui/`:
- `components/ui/use-mobile.tsx`
- `components/ui/use-toast.ts`

These are shadcn/ui versions. The hooks here may be custom implementations or re-exports.

## Creating New Hooks

Follow this pattern:

```typescript
"use client"

import { useState, useEffect } from "react"

export function useMyHook(param: string) {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Fetch or compute data
  }, [param])

  return { data, isLoading, error }
}
```

## Related Documentation

- [Components](/components/README.md)
- [Lib Utilities](/lib/README.md)
