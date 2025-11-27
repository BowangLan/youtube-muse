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
    const { playerRef, isPlaying } = get()
    if (playerRef) {
      // Clear loading flag to allow state updates from user interaction
      set({ isLoadingNewVideo: false })

      if (isPlaying) {
        set({ pendingPlayState: false, isPlaying: false })
        playerRef.pauseVideo()
      } else {
        set({ pendingPlayState: true, isPlaying: true })
        playerRef.playVideo()
      }
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
      playerRef.setVolume(volume)
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
}))
