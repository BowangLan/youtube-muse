import { create } from "zustand"

/**
 * Runtime state of the Spotify Web Playback SDK device (not persisted).
 * The SDK player instance itself is held here like the YouTube player
 * instance store, so adapters and hooks share one handle.
 */
interface SpotifyPlayerState {
  player: SpotifySDK.Player | null
  deviceId: string | null
  isReady: boolean
  /** Human-readable reason playback is unavailable (e.g. Premium required) */
  playbackError: string | null
}

interface SpotifyPlayerActions {
  setPlayer: (player: SpotifySDK.Player | null) => void
  getPlayer: () => SpotifySDK.Player | null
  setDevice: (deviceId: string | null, isReady: boolean) => void
  setPlaybackError: (error: string | null) => void
  reset: () => void
}

export const useSpotifyPlayerStore = create<
  SpotifyPlayerState & SpotifyPlayerActions
>((set, get) => ({
  player: null,
  deviceId: null,
  isReady: false,
  playbackError: null,

  setPlayer: (player) => set({ player }),
  getPlayer: () => get().player,
  setDevice: (deviceId, isReady) => set({ deviceId, isReady }),
  setPlaybackError: (playbackError) => set({ playbackError }),
  reset: () =>
    set({ player: null, deviceId: null, isReady: false, playbackError: null }),
}))
