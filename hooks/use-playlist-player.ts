"use client"

import * as React from "react"
import { useYouTubePlayer } from "./use-youtube-player"
import { useMediaSession } from "./use-media-session"
import { usePlaylistStore } from "@/lib/store/playlist-store"
import { usePlayerStore } from "@/lib/store/player-store"

/**
 * Enhanced player hook that integrates with playlist functionality
 * Automatically plays next/previous tracks from the current playlist
 */
export function usePlaylistPlayer() {
  const {
    getCurrentTrack,
    currentPlaylistId,
    currentTrackIndex,
  } = usePlaylistStore()

  const {
    dispatch,
    isPlaying,
    currentTime,
    duration,
    volume,
  } = usePlayerStore()

  const currentTrack = getCurrentTrack()

  // Initialize YouTube player with current track
  useYouTubePlayer()

  // Initialize OS-level media controls
  useMediaSession()

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
    play: () => dispatch({ type: "UserPlay" }),
    pause: () => dispatch({ type: "UserPause" }),
    togglePlay: () => dispatch({ type: "UserTogglePlay" }),
    seek: (time: number) => dispatch({ type: "UserSeek", seconds: time }),
    setVolume: (value: number) => dispatch({ type: "UserSetVolume", volume: value }),
    skipForward: () => dispatch({ type: "UserSkipForward" }),
    skipBackward: () => dispatch({ type: "UserSkipBackward" }),

    // Playlist controls
    playNext: () => dispatch({ type: "UserNextTrack" }),
    playPrevious: () => dispatch({ type: "UserPreviousTrack" }),
    currentTrack,
    currentPlaylistId,
    currentTrackIndex,
    hasNextTrack: currentPlaylistId !== null,
    hasPreviousTrack: currentPlaylistId !== null && currentTrackIndex > 0,
  }
}
