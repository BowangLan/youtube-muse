import { useEffect } from "react"
import { usePlayerStore } from "@/lib/store/player-store"
import { usePlaylistStore } from "@/lib/store/playlist-store"
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store"
import { useKeyboardFeedbackStore } from "@/lib/store/keyboard-feedback-store"
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store"

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

      const { dispatch, volume, duration, isPlaying } = usePlayerStore.getState()
      const { playlists, setCurrentPlaylist, setCurrentTrackIndex } =
        usePlaylistStore.getState()
      const { videoMode, setVideoMode } = useYouTubePlayerInstanceStore.getState()
      const {
        hiddenBuiltInIntents,
        gradientOverrides,
        intentMetadataByPlaylistId,
        intentPlaylistOrder,
      } = useCustomIntentsStore.getState()
      const { showFeedback } = useKeyboardFeedbackStore.getState()

      // Handle different key combinations
      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey

      // Prevent default for keys we're handling
      const shouldPreventDefault = () => {
        if (key === " " || key === "k") return true
        if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key)) return true
        if (["f", "j", "l", "m", "n", "p", "v"].includes(key)) return true
        if (!isNaN(Number(key))) return true
        return false
      }

      if (shouldPreventDefault()) {
        e.preventDefault()
      }

      // Playback controls
      if (key === " " || key === "k") {
        const willPlay = !isPlaying
        dispatch({ type: "UserTogglePlay" })
        showFeedback({
          label: willPlay ? "Play" : "Pause",
          icon: willPlay ? "play" : "pause",
        })
        return
      }

      if (key === "arrowright" || key === "l") {
        dispatch({ type: "UserSkipForward" })
        showFeedback({
          label: "Skip +10s",
          icon: "seek-forward",
        })
        return
      }

      if (key === "arrowleft" || key === "j") {
        dispatch({ type: "UserSkipBackward" })
        showFeedback({
          label: "Skip -10s",
          icon: "seek-backward",
        })
        return
      }

      if (key === "n" && !ctrl) {
        dispatch({ type: "UserNextTrack" })
        showFeedback({
          label: "Next Track",
          icon: "next",
        })
        return
      }

      if (key === "p" && !ctrl) {
        dispatch({ type: "UserPreviousTrack" })
        showFeedback({
          label: "Previous Track",
          icon: "previous",
        })
        return
      }

      // Volume controls
      if (key === "arrowup") {
        const newVolume = Math.min(100, volume + 5)
        dispatch({ type: "UserSetVolume", volume: newVolume })
        showFeedback({
          label: `Volume ${newVolume}%`,
          icon: "volume",
        })
        return
      }

      if (key === "arrowdown") {
        const newVolume = Math.max(0, volume - 5)
        dispatch({ type: "UserSetVolume", volume: newVolume })
        showFeedback({
          label: `Volume ${newVolume}%`,
          icon: newVolume === 0 ? "mute" : "volume",
        })
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
          showFeedback({
            label: "Muted",
            icon: "mute",
          })
        } else {
          // Unmute to previous volume or default to 100
          const previousVolume = window.__previousVolume || 100
          dispatch({ type: "UserSetVolume", volume: previousVolume })
          showFeedback({
            label: `Volume ${previousVolume}%`,
            icon: "volume",
          })
        }
        return
      }

      if (key === "v") {
        const nextMode = videoMode === "hidden" ? "floating" : "hidden"
        setVideoMode(nextMode)
        showFeedback({
          label: nextMode === "hidden" ? "Video Hidden" : "Video Floating",
        })
        return
      }

      if (key === "f" && videoMode !== "hidden") {
        const nextMode = videoMode === "fullscreen" ? "floating" : "fullscreen"
        setVideoMode(nextMode)
        showFeedback({
          label: nextMode === "fullscreen" ? "Fullscreen" : "Video Floating",
        })
        return
      }

      // Intent selection with number keys (1-9)
      const numKey = parseInt(key)
      if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
        const hiddenNames = new Set(hiddenBuiltInIntents)
        const playlistById = new Map(playlists.map((playlist) => [playlist.id, playlist]))

        const allIntents = intentPlaylistOrder.flatMap((playlistId) => {
          const playlist = playlistById.get(playlistId)
          if (!playlist) return []
          const intent = intentMetadataByPlaylistId[playlistId]
          if (!intent) return []
          if (!intent.isCustom && hiddenNames.has(intent.name)) return []
          return [playlist]
        })

        // Select intent by number (1-indexed)
        const intentIndex = numKey - 1
        if (intentIndex < allIntents.length) {
          const selectedPlaylist = allIntents[intentIndex]
          setCurrentPlaylist(selectedPlaylist.id)
          setCurrentTrackIndex(0)

          // Get gradient for feedback
          const intent = intentMetadataByPlaylistId[selectedPlaylist.id]
          const gradientClassName = gradientOverrides[selectedPlaylist.id] ?? intent?.gradientClassName

          showFeedback({
            label: selectedPlaylist.name,
            icon: "play",
            gradientClassName: gradientClassName ? `${gradientClassName}-active` : undefined,
          })
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
