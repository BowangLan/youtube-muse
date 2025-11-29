import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Playlist, Track, PlaylistState, RepeatMode } from "@/lib/types/playlist"

interface PlaylistActions {
  // Playlist management
  createPlaylist: (name: string, description?: string, initialTracks?: Track[]) => void
  deletePlaylist: (playlistId: string) => void
  updatePlaylist: (playlistId: string, updates: Partial<Omit<Playlist, "id" | "tracks" | "createdAt">>) => void

  // Track management
  addTrackToPlaylist: (playlistId: string, track: Omit<Track, "addedAt">) => void
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void
  moveTrack: (playlistId: string, fromIndex: number, toIndex: number) => void

  // Playback control
  setCurrentPlaylist: (playlistId: string | null) => void
  setCurrentTrackIndex: (index: number) => void
  playNext: () => Track | null
  playPrevious: () => Track | null
  cycleRepeatMode: () => void

  // Shuffle control
  toggleShuffle: () => void
  generateShuffleOrder: () => void

  // Utility
  getCurrentTrack: () => Track | null
  getCurrentActualTrackIndex: () => number
  getPlaylist: (playlistId: string) => Playlist | undefined
  clearAllPlaylists: () => void
}

const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const usePlaylistStore = create<PlaylistState & PlaylistActions>()(
  persist(
    (set, get) => ({
      // Initial state
      playlists: [],
      currentPlaylistId: null,
      currentTrackIndex: 0,
      isShuffleEnabled: false,
      shuffleOrder: [],
      repeatMode: "off",

      // Playlist management
      createPlaylist: (name, description, initialTracks = []) => {
        const newPlaylist: Playlist = {
          id: generateId(),
          name,
          description,
          tracks: initialTracks,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        set((state) => ({
          playlists: [...state.playlists, newPlaylist],
        }))
      },

      deletePlaylist: (playlistId) => {
        set((state) => {
          const playlists = state.playlists.filter((p) => p.id !== playlistId)
          const currentPlaylistId =
            state.currentPlaylistId === playlistId ? null : state.currentPlaylistId
          return {
            playlists,
            currentPlaylistId,
            currentTrackIndex: currentPlaylistId === null ? 0 : state.currentTrackIndex,
          }
        })
      },

      updatePlaylist: (playlistId, updates) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? { ...p, ...updates, updatedAt: Date.now() }
              : p
          ),
        }))
      },

      // Track management
      addTrackToPlaylist: (playlistId, track) => {
        set((state) => ({
          playlists: state.playlists.map((p) =>
            p.id === playlistId
              ? {
                ...p,
                tracks: [...p.tracks, { ...track, addedAt: Date.now() }],
                updatedAt: Date.now(),
              }
              : p
          ),
        }))
      },

      removeTrackFromPlaylist: (playlistId, trackId) => {
        set((state) => {
          const playlist = state.playlists.find((p) => p.id === playlistId)
          if (!playlist) return state

          const newTracks = playlist.tracks.filter((t) => t.id !== trackId)
          const wasCurrentPlaylist = state.currentPlaylistId === playlistId

          // Adjust current track index if needed
          let newTrackIndex = state.currentTrackIndex
          if (wasCurrentPlaylist) {
            const currentTrack = playlist.tracks[state.currentTrackIndex]
            if (currentTrack?.id === trackId) {
              // If we removed the current track, stay at the same index (play next track)
              newTrackIndex = Math.min(state.currentTrackIndex, newTracks.length - 1)
            } else if (state.currentTrackIndex >= newTracks.length) {
              // If current index is out of bounds
              newTrackIndex = Math.max(0, newTracks.length - 1)
            }
          }

          return {
            playlists: state.playlists.map((p) =>
              p.id === playlistId
                ? { ...p, tracks: newTracks, updatedAt: Date.now() }
                : p
            ),
            currentTrackIndex: newTrackIndex,
          }
        })
      },

      moveTrack: (playlistId, fromIndex, toIndex) => {
        set((state) => {
          const playlist = state.playlists.find((p) => p.id === playlistId)
          if (!playlist || fromIndex < 0 || toIndex < 0 ||
            fromIndex >= playlist.tracks.length || toIndex >= playlist.tracks.length) {
            return state
          }

          const newTracks = [...playlist.tracks]
          const [movedTrack] = newTracks.splice(fromIndex, 1)
          newTracks.splice(toIndex, 0, movedTrack)

          // Adjust current track index if this is the current playlist
          let newTrackIndex = state.currentTrackIndex
          if (state.currentPlaylistId === playlistId) {
            if (state.currentTrackIndex === fromIndex) {
              newTrackIndex = toIndex
            } else if (fromIndex < state.currentTrackIndex && toIndex >= state.currentTrackIndex) {
              newTrackIndex = state.currentTrackIndex - 1
            } else if (fromIndex > state.currentTrackIndex && toIndex <= state.currentTrackIndex) {
              newTrackIndex = state.currentTrackIndex + 1
            }
          }

          return {
            playlists: state.playlists.map((p) =>
              p.id === playlistId
                ? { ...p, tracks: newTracks, updatedAt: Date.now() }
                : p
            ),
            currentTrackIndex: newTrackIndex,
          }
        })
      },

      // Playback control
      setCurrentPlaylist: (playlistId) => {
        set({ currentPlaylistId: playlistId, currentTrackIndex: 0 })
      },

      setCurrentTrackIndex: (index) => {
        const state = get()
        const playlist = state.currentPlaylistId
          ? state.playlists.find((p) => p.id === state.currentPlaylistId)
          : null

        if (playlist && index >= 0 && index < playlist.tracks.length) {
          set({ currentTrackIndex: index })
        }
      },

      playNext: () => {
        const state = get()
        if (!state.currentPlaylistId) return null

        const playlist = state.playlists.find((p) => p.id === state.currentPlaylistId)
        if (!playlist || playlist.tracks.length === 0) return null

        const nextIndex = state.currentTrackIndex + 1

        if (state.isShuffleEnabled && state.shuffleOrder.length > 0) {
          // In shuffle mode, use shuffle order
          if (nextIndex < state.shuffleOrder.length) {
            set({ currentTrackIndex: nextIndex })
            const actualTrackIndex = state.shuffleOrder[nextIndex]
            return playlist.tracks[actualTrackIndex]
          }

          if (state.repeatMode === "playlist") {
            const restartIndex = state.shuffleOrder[0]
            if (typeof restartIndex === "number") {
              set({ currentTrackIndex: 0 })
              return playlist.tracks[restartIndex] ?? null
            }
            return null
          }
        } else {
          // Normal sequential mode
          if (nextIndex < playlist.tracks.length) {
            set({ currentTrackIndex: nextIndex })
            return playlist.tracks[nextIndex]
          }

          if (state.repeatMode === "playlist" && playlist.tracks.length > 0) {
            set({ currentTrackIndex: 0 })
            return playlist.tracks[0] ?? null
          }
        }

        // Optionally loop back to start
        return null
      },

      playPrevious: () => {
        const state = get()
        if (!state.currentPlaylistId) return null

        const playlist = state.playlists.find((p) => p.id === state.currentPlaylistId)
        if (!playlist || playlist.tracks.length === 0) return null

        const prevIndex = state.currentTrackIndex - 1
        if (prevIndex >= 0) {
          set({ currentTrackIndex: prevIndex })

          if (state.isShuffleEnabled && state.shuffleOrder.length > 0) {
            // In shuffle mode, use shuffle order
            const actualTrackIndex = state.shuffleOrder[prevIndex]
            return playlist.tracks[actualTrackIndex]
          } else {
            // Normal sequential mode
            return playlist.tracks[prevIndex]
          }
        }

        return null
      },

      // Utility
      getCurrentTrack: () => {
        const state = get()
        if (!state.currentPlaylistId) return null

        const playlist = state.playlists.find((p) => p.id === state.currentPlaylistId)
        if (!playlist) return null

        if (state.isShuffleEnabled && state.shuffleOrder.length > 0) {
          // In shuffle mode, use shuffle order to get the actual track
          const actualTrackIndex = state.shuffleOrder[state.currentTrackIndex]
          return playlist.tracks[actualTrackIndex] || null
        }

        return playlist.tracks[state.currentTrackIndex] || null
      },

      getCurrentActualTrackIndex: () => {
        const state = get()
        if (state.isShuffleEnabled && state.shuffleOrder.length > 0) {
          // In shuffle mode, return the actual track index from shuffle order
          return state.shuffleOrder[state.currentTrackIndex] ?? state.currentTrackIndex
        }
        // In normal mode, return the current track index
        return state.currentTrackIndex
      },

      getPlaylist: (playlistId) => {
        return get().playlists.find((p) => p.id === playlistId)
      },

      clearAllPlaylists: () => {
        set({
          playlists: [],
          currentPlaylistId: null,
          currentTrackIndex: 0,
        })
      },

      // Shuffle control
      generateShuffleOrder: () => {
        const state = get()
        if (!state.currentPlaylistId) return

        const playlist = state.playlists.find((p) => p.id === state.currentPlaylistId)
        if (!playlist || playlist.tracks.length === 0) return

        // Create an array of indices [0, 1, 2, ..., n-1]
        const indices = Array.from({ length: playlist.tracks.length }, (_, i) => i)

        // Fisher-Yates shuffle algorithm
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[indices[i], indices[j]] = [indices[j], indices[i]]
        }

        set({ shuffleOrder: indices })
      },

      toggleShuffle: () => {
        const state = get()
        const newShuffleState = !state.isShuffleEnabled

        if (newShuffleState) {
          // Turning shuffle ON - generate shuffle order
          const playlist = state.currentPlaylistId
            ? state.playlists.find((p) => p.id === state.currentPlaylistId)
            : null

          if (playlist && playlist.tracks.length > 0) {
            // Get the actual current track index (in case we're already in some mode)
            const currentActualIndex = state.currentTrackIndex

            // Create an array of indices excluding the current track
            const indices = Array.from({ length: playlist.tracks.length }, (_, i) => i)
              .filter((i) => i !== currentActualIndex)

            // Fisher-Yates shuffle
            for (let i = indices.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1))
              ;[indices[i], indices[j]] = [indices[j], indices[i]]
            }

            // Put current track at the beginning of shuffle order
            const shuffleOrder = [currentActualIndex, ...indices]

            set({
              isShuffleEnabled: true,
              shuffleOrder,
              currentTrackIndex: 0, // Reset to first position in shuffle order
            })
          } else {
            set({ isShuffleEnabled: true, shuffleOrder: [] })
          }
        } else {
          // Turning shuffle OFF - find the actual track index
          const currentShuffleIndex = state.currentTrackIndex
          const actualTrackIndex = state.shuffleOrder[currentShuffleIndex] || 0

          set({
            isShuffleEnabled: false,
            shuffleOrder: [],
            currentTrackIndex: actualTrackIndex, // Return to actual playlist position
          })
        }
      },

      cycleRepeatMode: () => {
        set((state) => {
          const order: Record<RepeatMode, RepeatMode> = {
            off: "playlist",
            playlist: "one",
            one: "off",
          }
          return { repeatMode: order[state.repeatMode] }
        })
      },
    }),
    {
      name: "playlist-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
