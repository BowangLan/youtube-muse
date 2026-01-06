"use client"

import * as React from "react"
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store"

/**
 * Hook that automatically manages video quality based on video mode
 * - Hidden/Floating modes: Uses "small" (240p) for minimal bandwidth
 * - Fullscreen mode: Uses user's preferred quality or best available
 */
export function useVideoQuality() {
  const player = useYouTubePlayerInstanceStore((state) => state.player)
  const videoMode = useYouTubePlayerInstanceStore((state) => state.videoMode)
  const getQualityForMode = useYouTubePlayerInstanceStore((state) => state.getQualityForMode)
  const setCurrentQuality = useYouTubePlayerInstanceStore((state) => state.setCurrentQuality)
  const setAvailableQualities = useYouTubePlayerInstanceStore((state) => state.setAvailableQualities)

  const lastVideoModeRef = React.useRef(videoMode)
  const qualityChangeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Update available qualities when player is ready or video changes
  React.useEffect(() => {
    if (!player) return

    const updateAvailableQualities = () => {
      try {
        const qualities = player.getAvailableQualityLevels()
        if (qualities && qualities.length > 0) {
          setAvailableQualities(qualities)
        }
      } catch (error) {
        console.error("Failed to get available quality levels:", error)
      }
    }

    // Update immediately
    updateAvailableQualities()

    // Also update when video changes (after a small delay to ensure YouTube has loaded quality info)
    const interval = setInterval(() => {
      const currentQualities = player.getAvailableQualityLevels()
      if (currentQualities && currentQualities.length > 0) {
        setAvailableQualities(currentQualities)
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [player, setAvailableQualities])

  // Handle quality changes when video mode changes
  React.useEffect(() => {
    if (!player) return

    // Check if video mode actually changed
    if (lastVideoModeRef.current === videoMode) return
    lastVideoModeRef.current = videoMode

    // Clear any pending quality change
    if (qualityChangeTimeoutRef.current) {
      clearTimeout(qualityChangeTimeoutRef.current)
    }

    // Debounce quality change to avoid rapid switching during mode transitions
    qualityChangeTimeoutRef.current = setTimeout(() => {
      const targetQuality = getQualityForMode(videoMode)

      try {
        const currentQuality = player.getPlaybackQuality()

        // Only change if different
        if (currentQuality !== targetQuality) {
          player.setPlaybackQuality(targetQuality)
          setCurrentQuality(targetQuality)
        }
      } catch (error) {
        console.error("Failed to set playback quality:", error)
      }
    }, 300) // 300ms debounce

    return () => {
      if (qualityChangeTimeoutRef.current) {
        clearTimeout(qualityChangeTimeoutRef.current)
      }
    }
  }, [player, videoMode, getQualityForMode, setCurrentQuality])

  return undefined
}
