import { create } from "zustand"
import type { YTPlayer } from "@/lib/types/youtube"

interface PlayerState {
  // YouTube player instance
  playerRef: YTPlayer | null

  // Player state
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  apiReady: boolean

  // Loading state flags
  isLoadingNewVideo: boolean
  wasPlayingBeforeLoad: boolean
  pendingPlayState: boolean | null
}

interface PlayerActions {
  // Player instance management
  setPlayerRef: (player: YTPlayer | null) => void
  setApiReady: (ready: boolean) => void

  // Player state updates
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void

  // Loading state management
  setIsLoadingNewVideo: (loading: boolean) => void
  setWasPlayingBeforeLoad: (wasPlaying: boolean) => void
  setPendingPlayState: (state: boolean | null) => void

  // Player controls
  togglePlay: () => void
  seek: (time: number) => void
  handleVolumeChange: (volume: number) => void
  loadVideo: (videoId: string, autoplay?: boolean) => void
  skipForward: () => void
  skipBackward: () => void
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  // Initial state
  playerRef: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 100,
  apiReady: false,
  isLoadingNewVideo: false,
  wasPlayingBeforeLoad: false,
  pendingPlayState: null,

  // Player instance management
  setPlayerRef: (player) => set({ playerRef: player }),
  setApiReady: (ready) => set({ apiReady: ready }),

  // Player state updates
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),

  // Loading state management
  setIsLoadingNewVideo: (loading) => set({ isLoadingNewVideo: loading }),
  setWasPlayingBeforeLoad: (wasPlaying) => set({ wasPlayingBeforeLoad: wasPlaying }),
  setPendingPlayState: (state) => set({ pendingPlayState: state }),

  // Player controls
  togglePlay: () => {
    const { playerRef, isPlaying, isLoadingNewVideo } = get()
    if (!playerRef) return

    // Clear loading flag to allow state updates from user interaction
    set({ isLoadingNewVideo: false })

    if (isPlaying) {
      // Optimistically update pause state so the UI responds instantly
      playerRef.pauseVideo()
      set({ isPlaying: false, pendingPlayState: null })
    } else {
      // Optimistically mark as playing while guarding against buffer-induced flashes
      playerRef.playVideo()
      set({ isPlaying: true, pendingPlayState: true })
    }
  },

  seek: (time) => {
    const { playerRef } = get()
    if (playerRef) {
      playerRef.seekTo(time, true)
      set({ currentTime: time })
    }
  },

  handleVolumeChange: (volume) => {
    const { playerRef } = get()
    if (playerRef) {
      const normalizedVolume = (Math.exp(volume / 100) - 1) / (Math.E - 1) * 100
      console.log("Volume: ", volume, "Normalized: ", normalizedVolume)
      playerRef.setVolume(normalizedVolume)
      set({ volume })
    }
  },

  loadVideo: (videoId, autoplay = false) => {
    const { playerRef, isPlaying } = get()
    if (playerRef) {
      set({
        wasPlayingBeforeLoad: autoplay || isPlaying,
        isLoadingNewVideo: true,
      })
      playerRef.loadVideoById(videoId)
    }
  },

  skipForward: () => {
    const { playerRef, currentTime, duration } = get()
    if (playerRef) {
      const newTime = Math.min(currentTime + 10, duration)
      playerRef.seekTo(newTime, true)
      set({ currentTime: newTime })
    }
  },

  skipBackward: () => {
    const { playerRef, currentTime } = get()
    if (playerRef) {
      const newTime = Math.max(currentTime - 10, 0)
      playerRef.seekTo(newTime, true)
      set({ currentTime: newTime })
    }
  },
}))
