"use client"

import * as React from "react"
import { useYouTubePlayer } from "./use-youtube-player"
import { usePlaylistStore } from "@/lib/store/playlist-store"

/**
 * Enhanced player hook that integrates with playlist functionality
 * Automatically plays next/previous tracks from the current playlist
 */
export function usePlaylistPlayer() {
  const {
    getCurrentTrack,
    playNext,
    playPrevious,
    currentPlaylistId,
    currentTrackIndex,
  } = usePlaylistStore()

  const currentTrack = getCurrentTrack()
  const [videoId, setVideoId] = React.useState<string>(currentTrack?.id || "dQw4w9WgXcQ")

  // Update video when current track changes
  React.useEffect(() => {
    if (currentTrack) {
      setVideoId(currentTrack.id)
    }
  }, [currentTrack?.id])

  const player = useYouTubePlayer(videoId)

  // Enhanced next/previous that works with playlists
  const handlePlayNext = React.useCallback(() => {
    const nextTrack = playNext()
    if (nextTrack) {
      setVideoId(nextTrack.id)
    }
  }, [playNext])

  const handlePlayPrevious = React.useCallback(() => {
    const prevTrack = playPrevious()
    if (prevTrack) {
      setVideoId(prevTrack.id)
    }
  }, [playPrevious])

  // Auto-play next track when current track ends
  React.useEffect(() => {
    if (!player.isReady) return

    // Check if track has ended (current time is at duration)
    if (
      player.duration > 0 &&
      player.currentTime >= player.duration - 0.5 && // Small buffer
      !player.isPlaying &&
      currentPlaylistId
    ) {
      // Delay to ensure the video has actually ended
      const timeout = setTimeout(() => {
        handlePlayNext()
      }, 500)

      return () => clearTimeout(timeout)
    }
  }, [
    player.currentTime,
    player.duration,
    player.isPlaying,
    player.isReady,
    currentPlaylistId,
    handlePlayNext,
  ])

  // Play track by ID
  const playTrackById = React.useCallback((trackId: string) => {
    setVideoId(trackId)
  }, [])

  return {
    ...player,
    playNext: handlePlayNext,
    playPrevious: handlePlayPrevious,
    playTrackById,
    currentTrack,
    currentPlaylistId,
    currentTrackIndex,
    hasNextTrack: currentPlaylistId !== null, // Simplified check
    hasPreviousTrack: currentPlaylistId !== null && currentTrackIndex > 0,
  }
}
