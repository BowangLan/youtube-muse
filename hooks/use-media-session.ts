"use client"

import * as React from "react"
import { usePlayerStore } from "@/lib/store/player-store"
import { usePlaylistStore } from "@/lib/store/playlist-store"

export function useMediaSession() {
  const dispatch = usePlayerStore((state) => state.dispatch)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)

  const getCurrentTrack = usePlaylistStore((state) => state.getCurrentTrack)

  const currentTrack = getCurrentTrack()

  // Update track metadata
  React.useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack) {
      return
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.author,
      album: "YouTube Muse",
      artwork: [
        {
          src: currentTrack.thumbnailUrl,
          sizes: "480x360",
          type: "image/jpeg",
        },
        {
          src: currentTrack.thumbnailUrl.replace("hqdefault", "maxresdefault"),
          sizes: "1280x720",
          type: "image/jpeg",
        },
      ],
    })
  }, [currentTrack])

  // Register action handlers
  React.useEffect(() => {
    if (!("mediaSession" in navigator)) {
      return
    }

    // Play/Pause handlers
    const handlePlay = () => {
      if (!isPlaying) {
        dispatch({ type: "UserPlay" })
      }
    }

    const handlePause = () => {
      if (isPlaying) {
        dispatch({ type: "UserPause" })
      }
    }

    // Track navigation handlers
    const handleNextTrack = () => {
      dispatch({ type: "UserNextTrack" })
    }

    const handlePreviousTrack = () => {
      dispatch({ type: "UserPreviousTrack" })
    }

    // Seek handler
    const handleSeekTo = (details: MediaSessionActionDetails) => {
      if (details.seekTime !== undefined) {
        dispatch({ type: "UserSeek", seconds: details.seekTime })
      }
    }

    // Register all handlers
    navigator.mediaSession.setActionHandler("play", handlePlay)
    navigator.mediaSession.setActionHandler("pause", handlePause)
    navigator.mediaSession.setActionHandler("previoustrack", handlePreviousTrack)
    navigator.mediaSession.setActionHandler("nexttrack", handleNextTrack)
    navigator.mediaSession.setActionHandler("seekto", handleSeekTo)

    // Cleanup
    return () => {
      navigator.mediaSession.setActionHandler("play", null)
      navigator.mediaSession.setActionHandler("pause", null)
      navigator.mediaSession.setActionHandler("previoustrack", null)
      navigator.mediaSession.setActionHandler("nexttrack", null)
      navigator.mediaSession.setActionHandler("seekto", null)
    }
  }, [dispatch, isPlaying])

  // Update playback position
  React.useEffect(() => {
    if (!("mediaSession" in navigator) || !duration || isNaN(duration)) {
      return
    }

    try {
      navigator.mediaSession.setPositionState({
        duration: duration,
        playbackRate: 1.0,
        position: Math.min(currentTime, duration),
      })
    } catch (error) {
      // Ignore errors from invalid position states during transitions
      console.debug("Media Session position update skipped:", error)
    }
  }, [currentTime, duration])
}
