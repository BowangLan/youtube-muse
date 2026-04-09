"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { usePlayerStore } from "@/lib/store/player-store"
import { formatTime } from "@/lib/utils/youtube"

interface SliceRepeatProgressBarProps {
  className?: string
}

export function SliceRepeatProgressBar({ className }: SliceRepeatProgressBarProps) {
  const dispatch = usePlayerStore((state) => state.dispatch)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)
  const sliceRepeat = usePlayerStore((state) => state.sliceRepeat)
  
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isDraggingRef = React.useRef(false)
  const [isDragging, setIsDragging] = React.useState<"start" | "end" | "both" | null>(null)
  const [dragStartPos, setDragStartPos] = React.useState({ x: 0, startTime: 0, endTime: 0 })
  const [hoverTime, setHoverTime] = React.useState<number | null>(null)

  const progressPercent = duration ? (currentTime / duration) * 100 : 0
  const startPercent = sliceRepeat.startTime !== null && duration > 0
    ? (sliceRepeat.startTime / duration) * 100
    : 0
  const endPercent = sliceRepeat.endTime !== null && duration > 0
    ? (sliceRepeat.endTime / duration) * 100
    : startPercent // If no end set, end at start (will show just the start handle)

  const hoverPercent = hoverTime !== null && duration > 0
    ? (hoverTime / duration) * 100
    : null

  const getTimeFromPosition = React.useCallback((clientX: number): number => {
    if (!containerRef.current || duration <= 0) return 0
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = Math.max(0, Math.min(1, x / rect.width))
    return percent * duration
  }, [duration])

  const handleMouseMove = (e: React.MouseEvent) => {
    setHoverTime(getTimeFromPosition(e.clientX))
  }

  const handleMouseLeave = () => {
    setHoverTime(null)
  }

  const handleContainerClick = (e: React.MouseEvent) => {
    // Don't process click if we just finished dragging
    if (isDraggingRef.current) {
      isDraggingRef.current = false
      return
    }
    
    const time = getTimeFromPosition(e.clientX)
    
    if (sliceRepeat.startTime === null) {
      // First click sets start
      dispatch({ type: "UserSetSliceStart", seconds: time })
    } else if (sliceRepeat.endTime === null) {
      // Second click sets end
      dispatch({ type: "UserSetSliceEnd", seconds: time })
    } else {
      // Both set - clicking seeks to that position
      dispatch({ type: "UserSeek", seconds: time })
    }
  }

  const handleStartHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    setIsDragging("start")
    setDragStartPos({ 
      x: e.clientX, 
      startTime: sliceRepeat.startTime || 0,
      endTime: sliceRepeat.endTime || duration
    })
  }

  const handleEndHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    setIsDragging("end")
    setDragStartPos({ 
      x: e.clientX, 
      startTime: sliceRepeat.startTime || 0,
      endTime: sliceRepeat.endTime || duration
    })
  }

  const handleSliceAreaMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    setIsDragging("both")
    setDragStartPos({ 
      x: e.clientX, 
      startTime: sliceRepeat.startTime || 0,
      endTime: sliceRepeat.endTime || duration
    })
  }

  React.useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || duration <= 0) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const deltaX = e.clientX - dragStartPos.x
      const deltaPercent = deltaX / rect.width
      const deltaTime = deltaPercent * duration

      if (isDragging === "start") {
        const newStart = Math.max(0, Math.min(dragStartPos.endTime - 0.5, dragStartPos.startTime + deltaTime))
        dispatch({ type: "UserSetSliceStart", seconds: newStart })
      } else if (isDragging === "end") {
        const newEnd = Math.max(dragStartPos.startTime + 0.5, Math.min(duration, dragStartPos.endTime + deltaTime))
        dispatch({ type: "UserSetSliceEnd", seconds: newEnd })
      } else if (isDragging === "both") {
        const sliceDuration = dragStartPos.endTime - dragStartPos.startTime
        let newStart = dragStartPos.startTime + deltaTime
        let newEnd = newStart + sliceDuration
        
        // Clamp to bounds
        if (newStart < 0) {
          newStart = 0
          newEnd = sliceDuration
        } else if (newEnd > duration) {
          newEnd = duration
          newStart = duration - sliceDuration
        }
        
        dispatch({ type: "UserSetSliceStart", seconds: newStart })
        dispatch({ type: "UserSetSliceEnd", seconds: newEnd })
      }
    }

    const handleMouseUp = () => {
      // Small delay to let the click event fire first if it's a click
      setTimeout(() => {
        isDraggingRef.current = false
        setIsDragging(null)
      }, 50)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, dragStartPos, duration, dispatch])

  const hasStart = sliceRepeat.startTime !== null
  const hasEnd = sliceRepeat.endTime !== null
  const sliceWidth = Math.max(0.5, endPercent - startPercent)

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Time display for slice */}
      <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
        <span>
          {hasStart && hasEnd
            ? `${formatTime(sliceRepeat.startTime || 0)} - ${formatTime(sliceRepeat.endTime || duration)}`
            : hasStart
              ? `${formatTime(sliceRepeat.startTime || 0)} - ?`
              : "Click to set start point"
          }
        </span>
        {hasStart && hasEnd && (
          <span className="text-neutral-500">
            {formatTime((sliceRepeat.endTime || duration) - (sliceRepeat.startTime || 0))} loop
          </span>
        )}
      </div>

      {/* Progress bar container */}
      <div 
        ref={containerRef}
        className={cn(
          "relative h-3 rounded-full bg-white/10 cursor-pointer select-none",
          isDragging && "cursor-grabbing"
        )}
        onClick={handleContainerClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Background track */}
        <div className="absolute inset-0 rounded-full bg-white/10" />
        
        {/* Current progress indicator */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/30 transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Hover preview line (when setting end point) */}
        {hasStart && !hasEnd && hoverPercent !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10 pointer-events-none"
            style={{ left: `${hoverPercent}%` }}
          />
        )}

        {/* Slice highlight area - show when start is set */}
        {hasStart && (
          <>
            <div
              className="absolute inset-y-0 rounded-md bg-gradient-to-r from-orange-500/40 to-red-500/40 cursor-grab active:cursor-grabbing border-x-2 border-orange-400"
              style={{
                left: `${startPercent}%`,
                width: hasEnd ? `${sliceWidth}%` : `${Math.max(0.5, (hoverPercent || startPercent) - startPercent)}%`,
              }}
              onMouseDown={hasEnd ? handleSliceAreaMouseDown : undefined}
            />
            
            {/* Start handle - always show when start is set */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-6 -ml-2 rounded bg-orange-500 cursor-ew-resize hover:scale-110 active:scale-95 transition-transform shadow-lg z-20 flex items-center justify-center"
              style={{ left: `${startPercent}%` }}
              onMouseDown={handleStartHandleMouseDown}
              title="Drag to adjust start"
            >
              <div className="w-0.5 h-3 bg-white/60" />
            </div>
            
            {/* End handle - show when end is set OR show preview at hover position */}
            {hasEnd ? (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-6 -ml-2 rounded bg-red-500 cursor-ew-resize hover:scale-110 active:scale-95 transition-transform shadow-lg z-20 flex items-center justify-center"
                style={{ left: `${endPercent}%` }}
                onMouseDown={handleEndHandleMouseDown}
                title="Drag to adjust end"
              >
                <div className="w-0.5 h-3 bg-white/60" />
              </div>
            ) : hoverPercent !== null ? (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-6 -ml-2 rounded bg-red-500/50 cursor-pointer pointer-events-none z-20 flex items-center justify-center"
                style={{ left: `${hoverPercent}%` }}
                title="Click to set end point"
              >
                <div className="w-0.5 h-3 bg-white/40" />
              </div>
            ) : null}
          </>
        )}

        {/* Playhead indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg z-30 pointer-events-none"
          style={{ left: `${progressPercent}%`, marginLeft: "-6px" }}
        />
      </div>

      {/* Instructions */}
      <p className="text-xs text-neutral-500 text-center">
        {!hasStart 
          ? "Click on the bar to set the start point"
          : !hasEnd
            ? "Click on the bar to set the end point, or drag the orange handle"
            : "Drag handles to adjust, or click the slice to seek"
        }
      </p>
    </div>
  )
}
