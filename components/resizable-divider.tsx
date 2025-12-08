"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { GripVertical } from "lucide-react"

interface ResizableDividerProps {
  leftPanel: React.ReactNode
  rightPanel: React.ReactNode
  defaultLeftWidth?: number
  minLeftWidth?: number
  maxLeftWidth?: number
}

export function ResizableDivider({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 50,
  minLeftWidth = 30,
  maxLeftWidth = 70,
}: ResizableDividerProps) {
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

      if (newLeftWidth >= minLeftWidth && newLeftWidth <= maxLeftWidth) {
        setLeftWidth(newLeftWidth)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, minLeftWidth, maxLeftWidth])

  return (
    <div ref={containerRef} className="flex h-full w-full" style={{ cursor: isDragging ? "col-resize" : "default" }}>
      {/* Left Panel */}
      <div style={{ width: `${leftWidth}%` }} className="overflow-hidden">
        {leftPanel}
      </div>

      {/* Divider */}
      <div
        className="group relative flex w-1 cursor-col-resize items-center justify-center bg-border transition-colors hover:bg-accent"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="absolute flex h-12 w-6 items-center justify-center rounded-md bg-border opacity-0 transition-opacity group-hover:opacity-100">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ width: `${100 - leftWidth}%` }} className="overflow-hidden">
        {rightPanel}
      </div>
    </div>
  )
}
