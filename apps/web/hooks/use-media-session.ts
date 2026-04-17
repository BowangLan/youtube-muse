"use client"

import * as React from "react"
import { usePlayerStore } from "@/lib/store/player-store"
import { usePlaylistStore } from "@/lib/store/playlist-store"
import { SEEK_STEP_SECONDS } from "@/lib/player-core/reduce"

// ---------------------------------------------------------------------------
// Silent-audio audio-focus claimer.
//
// The YouTube IFrame Player runs in a cross-origin iframe and registers its
// own `navigator.mediaSession` on youtube.com. Chromium routes OS media keys
// (macOS Now Playing widget, headphones, lock screen, SMTC, MPRIS, etc.) to
// whichever frame currently *holds audio focus* — and that's the frame
// actually producing audio output. Since only the YouTube iframe outputs
// audio, the OS controls call YouTube's handlers, not ours. Symptoms:
//   - Pressing Play in Now Playing triggers YouTube's default play, which
//     races our reducer's "desiredPlayback === paused while observed ===
//     playing → re-pause" auto-correction, so playback dies after a frame.
//   - Pressing Next/Previous in Now Playing has no effect because YouTube's
//     embedded session has no concept of our app-level playlist.
//
// The fix is to play imperceptibly-quiet audio from our top-level frame so
// Chromium hands audio focus (and the OS Now Playing session) to us. A tiny
// looping silent WAV element does the job.
// ---------------------------------------------------------------------------

function buildSilentWavBlobUrl(): string {
  // 0.5s of 8kHz 16-bit mono PCM silence. ~8KB, generated once per session.
  const sampleRate = 8000
  const sampleCount = sampleRate / 2
  const dataBytes = sampleCount * 2
  const buffer = new ArrayBuffer(44 + dataBytes)
  const view = new DataView(buffer)
  const writeString = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) {
      view.setUint8(offset + i, value.charCodeAt(i))
    }
  }
  writeString(0, "RIFF")
  view.setUint32(4, 36 + dataBytes, true)
  writeString(8, "WAVE")
  writeString(12, "fmt ")
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeString(36, "data")
  view.setUint32(40, dataBytes, true)
  // Sample data is already zero-filled by ArrayBuffer.
  const blob = new Blob([buffer], { type: "audio/wav" })
  return URL.createObjectURL(blob)
}

let silentAudioElement: HTMLAudioElement | null = null
let silentAudioRefcount = 0

function acquireSilentAudio(): HTMLAudioElement {
  if (!silentAudioElement) {
    const audio = new Audio(buildSilentWavBlobUrl())
    audio.loop = true
    // Volume must be > 0 for Chromium to grant audio focus, but we want it
    // inaudible. 0.0001 is well below any speaker's noise floor.
    audio.volume = 0.0001
    audio.preload = "auto"
    audio.setAttribute("data-purpose", "media-session-focus-claimer")
    // Don't attach to the DOM; HTMLMediaElement playback works detached and
    // it's invisible either way.
    silentAudioElement = audio
  }
  silentAudioRefcount += 1
  return silentAudioElement
}

function releaseSilentAudio() {
  silentAudioRefcount = Math.max(0, silentAudioRefcount - 1)
  if (silentAudioRefcount === 0 && silentAudioElement) {
    silentAudioElement.pause()
    silentAudioElement.src = ""
    silentAudioElement = null
  }
}

// YouTube serves the same thumbnail URL under different filenames for each
// standard size. Providing multiple sizes lets the OS pick the best fit for
// Now Playing (macOS), SMTC (Windows), MPRIS (Linux), Android media
// notification, iOS control center, etc.
const YT_THUMBNAIL_SIZES: ReadonlyArray<{
  filename: string
  sizes: string
}> = [
  { filename: "default.jpg", sizes: "120x90" },
  { filename: "mqdefault.jpg", sizes: "320x180" },
  { filename: "hqdefault.jpg", sizes: "480x360" },
  { filename: "sddefault.jpg", sizes: "640x480" },
  { filename: "maxresdefault.jpg", sizes: "1280x720" },
]

function buildArtwork(thumbnailUrl: string): MediaImage[] {
  // Replace whatever size is encoded in the URL with each candidate size.
  // Fallback: if the URL doesn't match the expected pattern, just return it.
  const match = thumbnailUrl.match(/(.*\/)([^/]+\.jpg)(\?.*)?$/)
  if (!match) {
    return [{ src: thumbnailUrl, sizes: "480x360", type: "image/jpeg" }]
  }
  const [, base, , query = ""] = match
  return YT_THUMBNAIL_SIZES.map(({ filename, sizes }) => ({
    src: `${base}${filename}${query}`,
    sizes,
    type: "image/jpeg",
  }))
}

const MEDIA_SESSION_ACTIONS = [
  "play",
  "pause",
  "stop",
  "previoustrack",
  "nexttrack",
  "seekto",
  "seekforward",
  "seekbackward",
] as const satisfies readonly MediaSessionAction[]

function safeSetActionHandler(
  action: MediaSessionAction,
  handler: MediaSessionActionHandler | null,
) {
  try {
    navigator.mediaSession.setActionHandler(action, handler)
  } catch {
    // Some browsers throw NotSupportedError for actions they don't implement
    // (e.g. seekforward/seekbackward on older Safari). Silently ignore.
  }
}

export function useMediaSession() {
  const dispatch = usePlayerStore((state) => state.dispatch)
  const isPlaying = usePlayerStore((state) => state.isPlaying)
  const currentTime = usePlayerStore((state) => state.currentTime)
  const duration = usePlayerStore((state) => state.duration)

  // Acquire a refcounted silent audio element on mount so our top-level frame
  // can claim audio focus from the YouTube iframe.
  React.useEffect(() => {
    acquireSilentAudio()
    return () => {
      releaseSilentAudio()
    }
  }, [])

  // Mirror the silent audio to the YouTube player's play state. Critical
  // detail: we MUST pause the silent audio when YouTube pauses, otherwise
  // the OS Now Playing widget keeps detecting actual audio output and shows
  // a "pause" button — clicking it then dispatches `pause` again (a no-op
  // since we're already paused), so the user can never get back to play.
  //
  // Audio focus stickiness: Chromium hands the "controlling session" to
  // whichever frame most recently played media, and only reassigns when a
  // *different* frame starts playing. Since the YouTube iframe never starts
  // on its own (we drive it via the IFrame API), pausing our silent audio
  // briefly does not surrender focus back to YouTube — the next OS play
  // action still routes to our handler.
  React.useEffect(() => {
    const audio = silentAudioElement
    if (!audio) return
    if (isPlaying) {
      if (!audio.paused) return
      const playPromise = audio.play()
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          // Autoplay can be rejected if the gesture's transient activation
          // has expired by the time this effect runs. The next play cycle
          // will retry.
        })
      }
    } else {
      if (!audio.paused) {
        audio.pause()
      }
    }
  }, [isPlaying])

  const currentTrack = usePlaylistStore((state) => state.getCurrentTrack())
  const currentPlaylistId = usePlaylistStore((state) => state.currentPlaylistId)
  const currentTrackIndex = usePlaylistStore((state) => state.currentTrackIndex)
  const playlistTrackCount = usePlaylistStore((state) => {
    if (!state.currentPlaylistId) return 0
    return (
      state.playlists.find((p) => p.id === state.currentPlaylistId)?.tracks
        .length ?? 0
    )
  })
  const repeatMode = usePlaylistStore((state) => state.repeatMode)
  const isShuffleEnabled = usePlaylistStore((state) => state.isShuffleEnabled)

  const hasPlaylist = currentPlaylistId !== null && playlistTrackCount > 0
  const hasPreviousTrack = hasPlaylist && (isShuffleEnabled || currentTrackIndex > 0)
  const hasNextTrack =
    hasPlaylist &&
    (isShuffleEnabled ||
      repeatMode !== "off" ||
      currentTrackIndex < playlistTrackCount - 1)

  // Update track metadata (and clear it when there's no track).
  React.useEffect(() => {
    if (!("mediaSession" in navigator)) return

    if (!currentTrack) {
      navigator.mediaSession.metadata = null
      return
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.author,
      album: "YouTube Muse",
      artwork: buildArtwork(currentTrack.thumbnailUrl),
    })
  }, [currentTrack])

  // Reflect playback state so the OS shows the correct play/pause icon and
  // so the scrubber interpolates from the right baseline.
  React.useEffect(() => {
    if (!("mediaSession" in navigator)) return
    if (!currentTrack) {
      navigator.mediaSession.playbackState = "none"
      return
    }
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused"
  }, [isPlaying, currentTrack])

  // Register action handlers. We keep the latest dispatch/isPlaying in a ref
  // so the handlers don't need to re-register every tick.
  const latestRef = React.useRef({ dispatch, isPlaying })
  latestRef.current = { dispatch, isPlaying }

  React.useEffect(() => {
    if (!("mediaSession" in navigator)) return

    const handlePlay: MediaSessionActionHandler = () => {
      if (!latestRef.current.isPlaying) {
        latestRef.current.dispatch({ type: "UserPlay" })
      }
    }

    const handlePause: MediaSessionActionHandler = () => {
      if (latestRef.current.isPlaying) {
        latestRef.current.dispatch({ type: "UserPause" })
      }
    }

    const handleStop: MediaSessionActionHandler = () => {
      latestRef.current.dispatch({ type: "UserPause" })
      latestRef.current.dispatch({ type: "UserSeek", seconds: 0 })
    }

    const handleSeekTo: MediaSessionActionHandler = (details) => {
      if (details.seekTime === undefined) return
      // Honor `fastSeek` by still dispatching — the underlying player handles
      // coalescing repeated seeks during scrubbing.
      latestRef.current.dispatch({ type: "UserSeek", seconds: details.seekTime })
    }

    const handleSeekForward: MediaSessionActionHandler = (details) => {
      const offset = details.seekOffset ?? SEEK_STEP_SECONDS
      if (offset === SEEK_STEP_SECONDS) {
        latestRef.current.dispatch({ type: "UserSkipForward" })
        return
      }
      const { currentTime: now, duration: total } = usePlayerStore.getState()
      const target = Math.min(now + offset, total || now + offset)
      latestRef.current.dispatch({ type: "UserSeek", seconds: target })
    }

    const handleSeekBackward: MediaSessionActionHandler = (details) => {
      const offset = details.seekOffset ?? SEEK_STEP_SECONDS
      if (offset === SEEK_STEP_SECONDS) {
        latestRef.current.dispatch({ type: "UserSkipBackward" })
        return
      }
      const { currentTime: now } = usePlayerStore.getState()
      const target = Math.max(0, now - offset)
      latestRef.current.dispatch({ type: "UserSeek", seconds: target })
    }

    safeSetActionHandler("play", handlePlay)
    safeSetActionHandler("pause", handlePause)
    safeSetActionHandler("stop", handleStop)
    safeSetActionHandler("seekto", handleSeekTo)
    safeSetActionHandler("seekforward", handleSeekForward)
    safeSetActionHandler("seekbackward", handleSeekBackward)

    return () => {
      for (const action of MEDIA_SESSION_ACTIONS) {
        safeSetActionHandler(action, null)
      }
    }
  }, [])

  // Enable/disable track-navigation handlers based on playlist context so the
  // OS greys out Previous/Next when there's nothing to skip to.
  React.useEffect(() => {
    if (!("mediaSession" in navigator)) return

    safeSetActionHandler(
      "nexttrack",
      hasNextTrack
        ? () => latestRef.current.dispatch({ type: "UserNextTrack" })
        : null,
    )
    safeSetActionHandler(
      "previoustrack",
      hasPreviousTrack
        ? () => latestRef.current.dispatch({ type: "UserPreviousTrack" })
        : null,
    )
  }, [hasNextTrack, hasPreviousTrack])

  // Update playback position. We fire on currentTime/duration/isPlaying
  // changes so the OS scrubber stays accurate across play/pause transitions
  // and seeks.
  React.useEffect(() => {
    if (!("mediaSession" in navigator)) return
    if (!duration || !Number.isFinite(duration) || duration <= 0) {
      return
    }
    if (typeof navigator.mediaSession.setPositionState !== "function") {
      return
    }

    try {
      // Keep playbackRate at 1.0 always; paused state is communicated via
      // `navigator.mediaSession.playbackState`. Some Chromium versions reject
      // playbackRate === 0.
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: 1.0,
        position: Math.max(0, Math.min(currentTime, duration)),
      })
    } catch (error) {
      // Transient invalid states during track transitions are expected.
      console.debug("Media Session position update skipped:", error)
    }
  }, [currentTime, duration, isPlaying])
}
