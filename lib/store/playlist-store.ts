import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { Playlist, Track, PlaylistState } from "@/lib/types/playlist"

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

  // Utility
  getCurrentTrack: () => Track | null
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
        if (nextIndex < playlist.tracks.length) {
          set({ currentTrackIndex: nextIndex })
          return playlist.tracks[nextIndex]
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
          return playlist.tracks[prevIndex]
        }

        return null
      },

      // Utility
      getCurrentTrack: () => {
        const state = get()
        if (!state.currentPlaylistId) return null

        const playlist = state.playlists.find((p) => p.id === state.currentPlaylistId)
        if (!playlist) return null

        return playlist.tracks[state.currentTrackIndex] || null
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
    }),
    {
      name: "playlist-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
