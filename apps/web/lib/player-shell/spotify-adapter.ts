import type { PlaybackAdapter } from "./playback-adapters"
import { startPlayback } from "@/lib/spotify/api"
import { useSpotifyStore } from "@/lib/store/spotify-store"
import { useSpotifyPlayerStore } from "@/lib/store/spotify-player-store"
import { usePlayerStore } from "@/lib/store/player-store"
import { normalizeVolume1 } from "./volume"

/**
 * Drives the Spotify Web Playback SDK device.
 *
 * Spotify has no "cue without playing" API — `PUT /me/player/play` always
 * starts playback. So `load` with autoplay starts immediately, while `load`
 * without autoplay only remembers the track; the deferred start happens on
 * the next `play()`. `loadedTrackId` tracks what the device is actually
 * playing so `play()` can distinguish resume from fresh start.
 */
export function createSpotifyAdapter(): PlaybackAdapter {
  let pendingTrackId: string | null = null
  let loadedTrackId: string | null = null
  let loadSeq = 0

  const getPlayer = () => useSpotifyPlayerStore.getState().getPlayer()

  const startTrack = async (trackId: string) => {
    const seq = ++loadSeq
    const { deviceId } = useSpotifyPlayerStore.getState()
    const accessToken = await useSpotifyStore.getState().getValidAccessToken()
    if (!deviceId || !accessToken) {
      usePlayerStore.getState().dispatch({
        type: "PlayerLoadFailed",
        reason: "Spotify player is not ready",
      })
      return
    }
    try {
      await startPlayback(accessToken, deviceId, trackId)
      if (seq !== loadSeq) return // superseded by a newer load
      loadedTrackId = trackId
      pendingTrackId = null
    } catch (error) {
      if (seq !== loadSeq) return
      const status = (error as Error & { status?: number }).status
      usePlayerStore.getState().dispatch({
        type: "PlayerLoadFailed",
        reason:
          status === 403
            ? "Spotify playback requires a Premium account"
            : `Failed to start Spotify playback (${status ?? "network error"})`,
      })
    }
  }

  return {
    play: () => {
      if (pendingTrackId) {
        void startTrack(pendingTrackId)
        return
      }
      if (loadedTrackId) {
        void getPlayer()?.resume()
      }
    },
    pause: () => {
      // The SDK errors ("no list was loaded") on transport commands sent to
      // a device with no loaded context — e.g. pauseOtherSources() on a
      // source switch before any Spotify track has played.
      if (!loadedTrackId) return
      void getPlayer()?.pause()
    },
    seek: (seconds) => {
      if (!loadedTrackId) return
      void getPlayer()?.seek(Math.max(0, Math.round(seconds * 1000)))
    },
    load: (trackRef, autoplay) => {
      if (autoplay) {
        void startTrack(trackRef)
      } else {
        pendingTrackId = trackRef
        loadedTrackId = null
      }
    },
    setVolume: (volume) => {
      void getPlayer()?.setVolume(normalizeVolume1(volume))
    },
  }
}
