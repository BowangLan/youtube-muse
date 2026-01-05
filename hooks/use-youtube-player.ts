"use client"

import * as React from "react"
import type { YTPlayer, YTPlayerEvent } from "@/lib/types/youtube"
import { usePlayerStore, setPlayerCommandRunner } from "@/lib/store/player-store"
import { usePlaylistStore } from "@/lib/store/playlist-store"
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store"
import { runPlayerCommands } from "@/lib/player-shell/cmd-runner"
import { createPlaylistQueueAdapter } from "@/lib/player-shell/queue-adapter"
import {
  ensureYouTubePlayerElement,
  setYouTubePlayerElement,
} from "@/components/player/youtube-player-element"
import "@/lib/types/youtube"

export function useYouTubePlayer() {
  const dispatch = usePlayerStore((state) => state.dispatch)
  const apiReady = usePlayerStore((state) => state.apiReady)
  const isPlaying = usePlayerStore((state) => state.isPlaying)

  const currentTrack = usePlaylistStore((state) => state.getCurrentTrack())

  const { setPlayer, getPlayer } = useYouTubePlayerInstanceStore()
  const queueAdapter = React.useMemo(() => createPlaylistQueueAdapter(), [])

  const syncTrackMetadataFromPlayer = React.useCallback(
    (playerInstance: YTPlayer, metadata?: { duration?: number }) => {
      const playlistState = usePlaylistStore.getState()
      const activeTrack = playlistState.getCurrentTrack()
      const playlistId = playlistState.currentPlaylistId
      if (!playlistId || !activeTrack) {
        return
      }

      const playerDuration = metadata?.duration ?? playerInstance.getDuration()
      if (activeTrack.duration === 0 && playerDuration > 0) {
        playlistState.updateTrackInfo(playlistId, activeTrack.id, {
          duration: playerDuration,
        })
      }
    },
    []
  )

  const runCommands = React.useCallback(
    (commands: Parameters<typeof runPlayerCommands>[0]) => {
      runPlayerCommands(commands, {
        getPlayer,
        dispatch,
        queueAdapter,
      })
    },
    [dispatch, queueAdapter, getPlayer]
  )

  // Load YouTube IFrame API
  React.useEffect(() => {
    const MIN_READY_DELAY = 1200

    // Helper to ensure setApiReady(true) fires AFTER 500ms
    let readyTimeout: NodeJS.Timeout | number | null = null
    let resolved = false

    const markReady = () => {
      if (resolved) return
      resolved = true
      dispatch({ type: "ApiReady" })
    }

    // If already available, still wait at least 500ms before setting
    if (window.YT && window.YT.Player) {
      readyTimeout = setTimeout(markReady, MIN_READY_DELAY)
      return () => {
        if (readyTimeout) clearTimeout(readyTimeout)
      }
    }

    // Don't reload if script is present, but still must wait for onYouTubeIframeAPIReady
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      window.onYouTubeIframeAPIReady = () => {
        // Wait at least 500ms before setting apiReady
        readyTimeout = setTimeout(markReady, MIN_READY_DELAY)
      }
      return () => {
        if (readyTimeout) clearTimeout(readyTimeout)
      }
    }

    // Otherwise, inject script and set a timer
    window.onYouTubeIframeAPIReady = () => {
      // Wait at least 500ms before setting apiReady
      readyTimeout = setTimeout(markReady, MIN_READY_DELAY)
    }

    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    const firstScriptTag = document.getElementsByTagName("script")[0]
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

    // Clean up
    return () => {
      if (readyTimeout) clearTimeout(readyTimeout)
    }
  }, [dispatch])

  React.useEffect(() => {
    setPlayerCommandRunner(runCommands)
    return () => {
      setPlayerCommandRunner(() => { })
    }
  }, [runCommands])

  // Initialize player
  React.useEffect(() => {
    if (!apiReady || getPlayer()) {
      return
    }

    // Create the player element
    ensureYouTubePlayerElement()

    const player = new window.YT.Player("youtube-player", {
      height: "100%",
      width: "100%",
      videoId: "",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: (event: YTPlayerEvent) => {
          const iframe = event.target.getIframe?.()
          if (iframe) {
            setYouTubePlayerElement(iframe)
          }
          const dur = event.target.getDuration()
          dispatch({ type: "PlayerReady", duration: dur })
        },
        onStateChange: (event: YTPlayerEvent) => {
          const stateMap: Record<number, "unstarted" | "ended" | "playing" | "paused" | "buffering" | "cued"> = {
            [-1]: "unstarted",
            0: "ended",
            1: "playing",
            2: "paused",
            3: "buffering",
            5: "cued",
          }
          const mappedState = stateMap[event.data] ?? "unstarted"
          const duration = event.target.getDuration()

          dispatch({
            type: "PlayerStateChanged",
            state: mappedState,
            duration: duration > 0 ? duration : undefined,
          })

          if (mappedState === "cued" || mappedState === "playing") {
            syncTrackMetadataFromPlayer(event.target, { duration })
          }
        },
      },
    })

    setPlayer(player)
  }, [apiReady, dispatch, syncTrackMetadataFromPlayer, setPlayer])


  // Update current time
  React.useEffect(() => {
    if (!isPlaying) {
      return
    }

    const interval = setInterval(() => {
      const player = getPlayer()
      if (player) {
        const time = player.getCurrentTime()
        dispatch({ type: "TimeTick", currentTime: time })
      }
    }, 250)

    return () => clearInterval(interval)
  }, [dispatch, isPlaying])

  const lastTrackIdRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    const nextTrackId = currentTrack?.id ?? null
    if (!nextTrackId || nextTrackId === lastTrackIdRef.current) {
      return
    }
    lastTrackIdRef.current = nextTrackId
    dispatch({ type: "TrackSelected", videoId: nextTrackId, autoplay: true })
  }, [currentTrack?.id, dispatch])

  return undefined
}
