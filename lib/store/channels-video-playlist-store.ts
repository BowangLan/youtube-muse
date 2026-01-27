import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Track } from "@/lib/types/playlist"

export interface ChannelVideoPlaylist {
  id: string
  name: string
  description?: string
  tracks: Track[]
  updatedAt: number
}

interface ChannelVideoPlaylistState {
  playlist: ChannelVideoPlaylist
  currentTrackIndex: number
}

interface ChannelVideoPlaylistActions {
  // Track management
  setTracks: (tracks: Track[]) => void
  removeTrack: (trackId: string) => void
  clearTracks: () => void

  // Playback control
  setCurrentTrackIndex: (index: number) => void

  // Utility
  getCurrentTrack: () => Track | null
  getTrackCount: () => number
}

const PLAYLIST_ID = "channels-latest-videos"

const DEFAULT_PLAYLIST: ChannelVideoPlaylist = {
  id: PLAYLIST_ID,
  name: "Latest Videos",
  description: "Latest videos from your subscribed channels",
  tracks: [],
  updatedAt: Date.now(),
}

const DEFAULT_STATE: ChannelVideoPlaylistState = {
  playlist: DEFAULT_PLAYLIST,
  currentTrackIndex: 0,
}

export const useChannelVideoPlaylistStore = create<
  ChannelVideoPlaylistState & ChannelVideoPlaylistActions
>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,

      setTracks: (tracks) => {
        set((state) => {
          const maxIndex = Math.max(0, tracks.length - 1)
          const nextTrackIndex = Math.min(state.currentTrackIndex, maxIndex)

          return {
            playlist: {
              ...state.playlist,
              tracks,
              updatedAt: Date.now(),
            },
            currentTrackIndex: tracks.length === 0 ? 0 : nextTrackIndex,
          }
        })
      },

      removeTrack: (trackId) => {
        set((state) => {
          const trackIndex = state.playlist.tracks.findIndex((t) => t.id === trackId)
          if (trackIndex === -1) return state

          const newTracks = state.playlist.tracks.filter((t) => t.id !== trackId)
          
          // Adjust current track index if needed
          let newCurrentIndex = state.currentTrackIndex
          if (trackIndex < state.currentTrackIndex) {
            // Removed track was before current, shift index down
            newCurrentIndex = Math.max(0, state.currentTrackIndex - 1)
          } else if (trackIndex === state.currentTrackIndex && newTracks.length > 0) {
            // Removed current track, keep index but clamp to new length
            newCurrentIndex = Math.min(state.currentTrackIndex, newTracks.length - 1)
          } else if (newTracks.length === 0) {
            newCurrentIndex = 0
          }

          return {
            playlist: {
              ...state.playlist,
              tracks: newTracks,
              updatedAt: Date.now(),
            },
            currentTrackIndex: newCurrentIndex,
          }
        })
      },

      clearTracks: () => {
        set((state) => ({
          playlist: {
            ...state.playlist,
            tracks: [],
            updatedAt: Date.now(),
          },
          currentTrackIndex: 0,
        }))
      },

      setCurrentTrackIndex: (index) => {
        const state = get()
        const trackCount = state.playlist.tracks.length

        if (index >= 0 && index < trackCount) {
          set({ currentTrackIndex: index })
        }
      },

      getCurrentTrack: () => {
        const state = get()
        return state.playlist.tracks[state.currentTrackIndex] || null
      },

      getTrackCount: () => {
        return get().playlist.tracks.length
      },
    }),
    {
      name: "channels-video-playlist-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)

// Export playlist ID for use in other components
export const CHANNEL_VIDEO_PLAYLIST_ID = PLAYLIST_ID
