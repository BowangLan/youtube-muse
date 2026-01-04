import { useEffect } from "react"
import { usePlayerStore } from "@/lib/store/player-store"
import { usePlaylistStore } from "@/lib/store/playlist-store"
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store"
import { INTENTS } from "@/lib/intents"

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
 * Intent Selection:
 * - 1-9: Play intent card 1-9
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
      const { playlists, setCurrentPlaylist, setCurrentTrackIndex } =
        usePlaylistStore.getState()
      const { customIntents, hiddenBuiltInIntents } =
        useCustomIntentsStore.getState()

      // Handle different key combinations
      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey

      // Prevent default for keys we're handling
      const shouldPreventDefault = () => {
        if (key === " " || key === "k") return true
        if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) return true
        if (["j", "l", "n", "p", "m"].includes(key)) return true
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

      // Intent selection with number keys (1-9)
      const numKey = parseInt(key)
      if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
        // Get all intent playlists in order (built-in + custom)
        const intentNames = new Set(INTENTS.map((i) => i.name))
        const hiddenNames = new Set(hiddenBuiltInIntents)

        // Get built-in intents (not hidden)
        const intentPlaylists = playlists
          .filter((p) => intentNames.has(p.name) && !hiddenNames.has(p.name))
          .sort(
            (a, b) =>
              INTENTS.findIndex((i) => i.name === a.name) -
              INTENTS.findIndex((i) => i.name === b.name)
          )

        // Get custom intent playlists
        const customPlaylistIds = new Set(customIntents.map((ci) => ci.playlistId))
        const customIntentPlaylists = playlists.filter((p) =>
          customPlaylistIds.has(p.id)
        )

        // Combine all intents
        const allIntents = [...intentPlaylists, ...customIntentPlaylists]

        // Select intent by number (1-indexed)
        const intentIndex = numKey - 1
        if (intentIndex < allIntents.length) {
          const selectedPlaylist = allIntents[intentIndex]
          setCurrentPlaylist(selectedPlaylist.id)
          setCurrentTrackIndex(0)
        }
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
