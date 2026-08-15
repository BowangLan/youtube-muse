"use client"

import * as React from "react"
import { usePlayerStore } from "@/lib/store/player-store"
import { useSpotifyStore } from "@/lib/store/spotify-store"
import { useSpotifyPlayerStore } from "@/lib/store/spotify-player-store"
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store"
import { tokensHavePlaybackScopes } from "@/lib/spotify/auth"
import {
  registerPlaybackAdapter,
  unregisterPlaybackAdapter,
} from "@/lib/player-shell/playback-adapters"
import { createSpotifyAdapter } from "@/lib/player-shell/spotify-adapter"

const SDK_SCRIPT_SRC = "https://sdk.scdn.co/spotify-player.js"

let sdkLoadPromise: Promise<void> | null = null

function loadSpotifySdk(): Promise<void> {
  if (window.Spotify) return Promise.resolve()
  if (sdkLoadPromise) return sdkLoadPromise

  sdkLoadPromise = new Promise<void>((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve()
    if (!document.querySelector(`script[src="${SDK_SCRIPT_SRC}"]`)) {
      const tag = document.createElement("script")
      tag.src = SDK_SCRIPT_SRC
      tag.async = true
      document.head.appendChild(tag)
    }
  })
  return sdkLoadPromise
}

/**
 * Owns the Spotify Web Playback SDK lifecycle:
 * - creates the SDK device while a connected account has playback scopes
 * - registers the "spotify" playback adapter with the command runner
 * - bridges SDK state events into the shared player reducer (gated so only
 *   the active source feeds observed playback state)
 */
export function useSpotifyPlayer() {
  const dispatch = usePlayerStore((state) => state.dispatch)
  const scope = useSpotifyStore((state) => state.tokens?.scope)
  const isConnected = useSpotifyStore((state) => state.tokens !== null)
  const canPlayback = isConnected && tokensHavePlaybackScopes(scope)

  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const activeSource = usePlayerStore((state) => state.activeSource)

  // Tracks position across state events so we can tell "track finished"
  // apart from "user paused at the start".
  const lastPositionRef = React.useRef(0)
  const endedTrackUriRef = React.useRef<string | null>(null)

  // Spotify playback is audio-only: collapse any floating/fullscreen YouTube
  // video when a Spotify track takes over (its video-mode UI is also hidden).
  React.useEffect(() => {
    if (activeSource !== "spotify") return
    const { videoMode, setVideoMode } = useYouTubePlayerInstanceStore.getState()
    if (videoMode !== "hidden") {
      setVideoMode("hidden")
    }
  }, [activeSource])

  React.useEffect(() => {
    if (!canPlayback) return

    let cancelled = false
    let player: SpotifySDK.Player | null = null

    void loadSpotifySdk().then(() => {
      if (cancelled || !window.Spotify) return

      player = new window.Spotify.Player({
        name: "YouTube Muse",
        getOAuthToken: (cb) => {
          void (async () => {
            const token = await useSpotifyStore.getState().getValidAccessToken()
            // eslint-disable-next-line promise/no-callback-in-promise -- SDK contract is callback-based
            if (token) cb(token)
          })()
        },
        volume: usePlayerStore.getState().volume / 100,
      })

      player.addListener("ready", ({ device_id }) => {
        if (cancelled) return
        useSpotifyPlayerStore.getState().setDevice(device_id, true)
        useSpotifyPlayerStore.getState().setPlaybackError(null)
        registerPlaybackAdapter("spotify", createSpotifyAdapter())
      })

      player.addListener("not_ready", ({ device_id }) => {
        useSpotifyPlayerStore.getState().setDevice(device_id, false)
      })

      player.addListener("player_state_changed", (state) => {
        if (!state) return
        if (usePlayerStore.getState().activeSource !== "spotify") return

        const positionSeconds = state.position / 1000
        const durationSeconds = state.duration / 1000
        const trackUri = state.track_window.current_track?.uri ?? null

        // A natural end can produce more than one paused-at-zero snapshot for
        // the outgoing track. After the first one requests the next queue item,
        // letting another reach the reducer would trigger its desired-playing
        // reconciliation and resume the old track from 0 while React is still
        // selecting/loading the next one. Ignore terminal snapshots only for
        // that exact URI; a state for the newly loaded track clears the guard.
        if (endedTrackUriRef.current) {
          if (
            trackUri === endedTrackUriRef.current &&
            state.paused &&
            state.position === 0
          ) {
            return
          }
          if (
            trackUri !== endedTrackUriRef.current ||
            !state.paused ||
            state.position > 0
          ) {
            endedTrackUriRef.current = null
            lastPositionRef.current = 0
          }
        }

        // End-of-track: the SDK rewinds to a paused position 0 after playing
        // near the end. There is no explicit "ended" event.
        const reachedEnd =
          state.paused &&
          state.position === 0 &&
          state.duration > 0 &&
          lastPositionRef.current > state.duration - 5000 &&
          lastPositionRef.current > 0

        if (reachedEnd) {
          endedTrackUriRef.current = trackUri
          lastPositionRef.current = 0
          dispatch({
            type: "PlayerStateChanged",
            state: "ended",
            duration: durationSeconds,
          })
          return
        }
        lastPositionRef.current = state.position

        dispatch({
          type: "PlayerStateChanged",
          state: state.loading ? "buffering" : state.paused ? "paused" : "playing",
          duration: durationSeconds > 0 ? durationSeconds : undefined,
        })
        dispatch({ type: "TimeTick", currentTime: positionSeconds })
      })

      player.addListener("initialization_error", ({ message }) => {
        useSpotifyPlayerStore
          .getState()
          .setPlaybackError(`Spotify player failed to initialize: ${message}`)
      })
      player.addListener("authentication_error", ({ message }) => {
        useSpotifyPlayerStore
          .getState()
          .setPlaybackError(`Spotify authentication failed: ${message}`)
      })
      player.addListener("account_error", () => {
        useSpotifyPlayerStore
          .getState()
          .setPlaybackError(
            "Spotify Premium is required to play music in the browser."
          )
      })
      player.addListener("playback_error", ({ message }) => {
        // eslint-disable-next-line no-console
        console.error("Spotify playback error:", message)
      })

      useSpotifyPlayerStore.getState().setPlayer(player)
      void player.connect()
    })

    return () => {
      cancelled = true
      unregisterPlaybackAdapter("spotify")
      player?.disconnect()
      useSpotifyPlayerStore.getState().reset()
    }
  }, [canPlayback, dispatch])

  // Poll position while Spotify is the active, playing source. The SDK only
  // pushes state on transitions, so progress needs a tick like YouTube's.
  React.useEffect(() => {
    if (!isPlaying || activeSource !== "spotify") return

    const interval = setInterval(() => {
      const player = useSpotifyPlayerStore.getState().getPlayer()
      if (!player) return
      void player.getCurrentState().then((state) => {
        if (!state || state.paused) return
        if (usePlayerStore.getState().activeSource !== "spotify") return
        lastPositionRef.current = state.position
        dispatch({ type: "TimeTick", currentTime: state.position / 1000 })
      })
    }, 250)

    return () => clearInterval(interval)
  }, [isPlaying, activeSource, dispatch])

  return undefined
}
