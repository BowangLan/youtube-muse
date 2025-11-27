"use client"

import * as React from "react"
import { useYouTubePlayer } from "./use-youtube-player"
import { usePlaylistStore } from "@/lib/store/playlist-store"
import { usePlayerStore } from "@/lib/store/player-store"

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

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    handleVolumeChange,
    skipForward,
    skipBackward,
  } = usePlayerStore()

  const currentTrack = getCurrentTrack()

  // Initialize YouTube player with current track
  useYouTubePlayer()

  const isReady = duration > 0

  // Note: Auto-play next track is handled in useYouTubePlayer via YouTube's onStateChange event
  // This prevents duplicate triggers and ensures proper state synchronization

  return {
    // Player state
    isPlaying,
    currentTime,
    duration,
    volume,
    isReady,

    // Player controls
    play: togglePlay,
    pause: togglePlay,
    togglePlay,
    seek,
    setVolume: handleVolumeChange,
    skipForward,
    skipBackward,

    // Playlist controls
    playNext,
    playPrevious,
    currentTrack,
    currentPlaylistId,
    currentTrackIndex,
    hasNextTrack: currentPlaylistId !== null,
    hasPreviousTrack: currentPlaylistId !== null && currentTrackIndex > 0,
  }
}
