import { useEffect } from "react"
import { usePlayerStore } from "@/lib/store/player-store"

declare global {
  interface Window {
    __previousVolume?: number
  }
}

/**
 * Keyboard shortcuts for the music player
 *
 * Playback Controls:
 * - Space: Play/Pause
 * - K: Play/Pause (YouTube-style)
 * - Arrow Right: Skip forward 10s
 * - Arrow Left: Skip backward 10s
 * - L: Skip forward 10s (YouTube-style)
 * - J: Skip backward 10s (YouTube-style)
 * - N: Next track
 * - P: Previous track
 * - Shift + N: Next track (alternative)
 * - Shift + P: Previous track (alternative)
 *
 * Volume Controls:
 * - Arrow Up: Increase volume by 5%
 * - Arrow Down: Decrease volume by 5%
 * - M: Mute/Unmute
 *
 * Seeking:
 * - 0-9: Seek to 0%-90% of the track
 * - Home: Seek to start
 * - End: Seek to end
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or textareas
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      const { dispatch, volume, duration } = usePlayerStore.getState()

      // Handle different key combinations
      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey

      // Prevent default for keys we're handling
      const shouldPreventDefault = () => {
        if (key === " " || key === "k") return true
        if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) return true
        if (["j", "l", "n", "p", "m"].includes(key)) return true
        if (key === "home" || key === "end") return true
        if (!isNaN(Number(key))) return true
        return false
      }

      if (shouldPreventDefault()) {
        e.preventDefault()
      }

      // Playback controls
      if (key === " " || key === "k") {
        dispatch({ type: "UserTogglePlay" })
        return
      }

      if (key === "arrowright" || key === "l") {
        dispatch({ type: "UserSkipForward" })
        return
      }

      if (key === "arrowleft" || key === "j") {
        dispatch({ type: "UserSkipBackward" })
        return
      }

      if (key === "n" && !ctrl) {
        dispatch({ type: "UserNextTrack" })
        return
      }

      if (key === "p" && !ctrl) {
        dispatch({ type: "UserPreviousTrack" })
        return
      }

      // Volume controls
      if (key === "arrowup") {
        const newVolume = Math.min(100, volume + 5)
        dispatch({ type: "UserSetVolume", volume: newVolume })
        return
      }

      if (key === "arrowdown") {
        const newVolume = Math.max(0, volume - 5)
        dispatch({ type: "UserSetVolume", volume: newVolume })
        return
      }

      if (key === "m") {
        // Toggle mute
        if (volume > 0) {
          // Store current volume and mute
          const currentVolume = volume
          dispatch({ type: "UserSetVolume", volume: 0 })
          // Store the previous volume for unmuting
          window.__previousVolume = currentVolume
        } else {
          // Unmute to previous volume or default to 100
          const previousVolume = window.__previousVolume || 100
          dispatch({ type: "UserSetVolume", volume: previousVolume })
        }
        return
      }

      // Seeking with number keys (0-9)
      const numKey = parseInt(key)
      if (!isNaN(numKey) && numKey >= 0 && numKey <= 9) {
        const seekPercentage = numKey / 10
        const seekTime = duration * seekPercentage
        dispatch({ type: "UserSeek", seconds: seekTime })
        return
      }

      // Seek to start/end
      if (key === "home") {
        dispatch({ type: "UserSeek", seconds: 0 })
        return
      }

      if (key === "end") {
        dispatch({ type: "UserSeek", seconds: Math.max(0, duration - 1) })
        return
      }
    }

    // Add event listener
    window.addEventListener("keydown", handleKeyPress)

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyPress)
    }
  }, [])
}
