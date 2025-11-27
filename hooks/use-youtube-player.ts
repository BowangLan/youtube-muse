"use client"

import * as React from "react"
import type { YTPlayer } from "@/lib/types/youtube"
import { usePlayerStore } from "@/lib/store/player-store"
import { usePlaylistStore } from "@/lib/store/playlist-store"
import "@/lib/types/youtube"

export function useYouTubePlayer() {
  const {
    setPlayerRef,
    apiReady,
    setApiReady,
    isPlaying,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    isLoadingNewVideo,
    setIsLoadingNewVideo,
    wasPlayingBeforeLoad,
    setWasPlayingBeforeLoad,
    pendingPlayState,
    setPendingPlayState,
  } = usePlayerStore()

  const { playNext, getCurrentTrack } = usePlaylistStore()

  const playerRef = React.useRef<YTPlayer | null>(null)
  const currentTrack = getCurrentTrack()

  // Use ref to store latest callback to avoid stale closures in event handlers
  const handlePlayNextRef = React.useRef<() => void>(() => { })
  handlePlayNextRef.current = () => {
    const nextTrack = playNext()
    if (nextTrack && playerRef.current) {
      setWasPlayingBeforeLoad(isPlaying)
      setIsLoadingNewVideo(true)
      playerRef.current.loadVideoById(nextTrack.id)
    }
  }

  // Stable wrapper function for event handlers
  const handlePlayNext = React.useCallback(() => {
    handlePlayNextRef.current?.()
  }, [])

  // Load YouTube IFrame API
  React.useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true)
      return
    }

    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      return
    }

    window.onYouTubeIframeAPIReady = () => {
      setApiReady(true)
    }

    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
  }, [setApiReady])

  // Initialize player
  React.useEffect(() => {
    if (!apiReady || playerRef.current) {
      return
    }

    const player = new window.YT.Player("youtube-player", {
      height: "1",
      width: "1",
      videoId: currentTrack?.id || "dQw4w9WgXcQ",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
      },
      events: {
        onReady: (event: any) => {
          const dur = event.target.getDuration()
          setDuration(dur)
        },
        onStateChange: (event: any) => {
          const newIsPlaying = event.data === window.YT.PlayerState.PLAYING

          // Update duration when video is cued or playing (new video loaded)
          if (
            event.data === window.YT.PlayerState.CUED ||
            event.data === window.YT.PlayerState.PLAYING
          ) {
            const dur = event.target.getDuration()
            if (dur > 0) {
              setDuration(dur)
              setCurrentTime(0) // Reset current time when loading new video
            }
            // When video is cued, clear loading flag and possibly auto-play
            if (
              event.data === window.YT.PlayerState.CUED &&
              isLoadingNewVideo
            ) {
              setIsLoadingNewVideo(false)
              // If we were playing before, resume playback
              if (wasPlayingBeforeLoad) {
                setWasPlayingBeforeLoad(false)
                event.target.playVideo()
              }
            }
          }

          // If we're loading a new video, don't update playing state to prevent flash
          if (isLoadingNewVideo) {
            // Ignore state changes during initial video loading
            return
          }

          // Update playing state based on YouTube player state
          // Ignore transient PAUSED events while a play action is pending to avoid UI flashes
          if (
            pendingPlayState &&
            event.data === window.YT.PlayerState.PAUSED
          ) {
            return
          }

          // Clear pending state when we reach a definitive state
          if (
            event.data === window.YT.PlayerState.PLAYING ||
            event.data === window.YT.PlayerState.PAUSED
          ) {
            setPendingPlayState(null)
            setIsPlaying(newIsPlaying)
          } else {
            // For other states (BUFFERING, CUED, etc.), only update if no pending operation
            if (pendingPlayState === null) {
              setIsPlaying(newIsPlaying)
            }
          }

          if (event.data === window.YT.PlayerState.ENDED) {
            handlePlayNext()
          }
        },
      },
    })

    playerRef.current = player
    setPlayerRef(player)
  }, [apiReady])

  // Update current time
  React.useEffect(() => {
    if (!isPlaying) {
      return
    }

    const interval = setInterval(() => {
      if (playerRef.current) {
        const time = playerRef.current.getCurrentTime()
        setCurrentTime(time)
      }
    }, 250)

    return () => clearInterval(interval)
  }, [isPlaying, setCurrentTime])

  // Load new track
  React.useEffect(() => {
    if (currentTrack && playerRef.current) {
      playerRef.current.loadVideoById(currentTrack.id)
      // Duration will be updated in onStateChange event handler
    }
  }, [currentTrack?.id])

  return {
    playerRef: playerRef.current,
    handlePlayNext,
  }
}
