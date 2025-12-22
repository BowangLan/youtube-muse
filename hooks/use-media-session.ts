"use client"

import * as React from "react"
import { usePlayerStore } from "@/lib/store/player-store"
import { usePlaylistStore } from "@/lib/store/playlist-store"

export function useMediaSession() {
  const {
    playerRef,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
  } = usePlayerStore()

  const {
    getCurrentTrack,
    playNext,
    playPrevious,
  } = usePlaylistStore()

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
        togglePlay()
      }
    }

    const handlePause = () => {
      if (isPlaying) {
        togglePlay()
      }
    }

    // Track navigation handlers
    const handleNextTrack = () => {
      const nextTrack = playNext()
      if (nextTrack && playerRef) {
        playerRef.loadVideoById(nextTrack.id)
      }
    }

    const handlePreviousTrack = () => {
      const prevTrack = playPrevious()
      if (prevTrack && playerRef) {
        playerRef.loadVideoById(prevTrack.id)
      }
    }

    // Seek handler
    const handleSeekTo = (details: MediaSessionActionDetails) => {
      if (details.seekTime !== undefined) {
        seek(details.seekTime)
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
  }, [isPlaying, playerRef, togglePlay, seek, playNext, playPrevious])

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
