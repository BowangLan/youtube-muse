"use client"

import * as React from "react"
import type { YTPlayer } from "@/lib/types/youtube"
import "@/lib/types/youtube"

interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  title: string
  isReady: boolean
}

export function useYouTubePlayer(videoId: string) {
  const playerRef = React.useRef<YTPlayer | null>(null)
  const [apiReady, setApiReady] = React.useState(false)
  const [state, setState] = React.useState<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 50,
    title: "Loading...",
    isReady: false,
  })

  // Load YouTube IFrame API
  React.useEffect(() => {
    // Check if API is already loaded
    if (window.YT && window.YT.Player) {
      setApiReady(true)
      return
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      return
    }

    // Set up callback before loading script
    window.onYouTubeIframeAPIReady = () => {
      setApiReady(true)
    }

    // Load the API script
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
  }, [])

  // Initialize player when API is ready
  React.useEffect(() => {
    if (!apiReady || !videoId || playerRef.current) {
      return
    }

    playerRef.current = new window.YT.Player("youtube-player", {
      height: "1",
      width: "1",
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
      },
      events: {
        onReady: (event: { target: YTPlayer }) => {
          const videoData = event.target.getVideoData()
          const duration = event.target.getDuration()
          setState((prev) => ({
            ...prev,
            title: videoData.title,
            duration,
            isReady: true,
          }))
        },
        onStateChange: (event: { data: number; target: YTPlayer }) => {
          const isPlaying = event.data === window.YT.PlayerState.PLAYING
          setState((prev) => ({ ...prev, isPlaying }))
        },
      },
    })

    return () => {
      if (playerRef.current) {
        playerRef.current = null
      }
    }
  }, [apiReady, videoId])

  // Update current time
  React.useEffect(() => {
    if (!state.isPlaying) {
      return
    }

    const interval = setInterval(() => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime()
        setState((prev) => ({ ...prev, currentTime }))
      }
    }, 250)

    return () => clearInterval(interval)
  }, [state.isPlaying])

  const play = React.useCallback(() => {
    playerRef.current?.playVideo()
  }, [])

  const pause = React.useCallback(() => {
    playerRef.current?.pauseVideo()
  }, [])

  const togglePlay = React.useCallback(() => {
    if (state.isPlaying) {
      pause()
    } else {
      play()
    }
  }, [state.isPlaying, play, pause])

  const seek = React.useCallback((time: number) => {
    playerRef.current?.seekTo(time, true)
    setState((prev) => ({ ...prev, currentTime: time }))
  }, [])

  const setVolume = React.useCallback((volume: number) => {
    playerRef.current?.setVolume(volume)
    setState((prev) => ({ ...prev, volume }))
  }, [])

  const skipForward = React.useCallback(() => {
    if (playerRef.current) {
      const newTime = Math.min(
        playerRef.current.getCurrentTime() + 10,
        state.duration
      )
      seek(newTime)
    }
  }, [state.duration, seek])

  const skipBackward = React.useCallback(() => {
    if (playerRef.current) {
      const newTime = Math.max(playerRef.current.getCurrentTime() - 10, 0)
      seek(newTime)
    }
  }, [seek])

  return {
    ...state,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    skipForward,
    skipBackward,
  }
}
