import { create } from "zustand"
import { persist, createJSONStorage, type PersistStorage, type StorageValue } from "zustand/middleware"
import { z } from "zod/v4"
import type { Playlist, Track, PlaylistState, RepeatMode } from "@/lib/types/playlist"

// Zod schemas for validation
const TrackSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  authorUrl: z.string(),
  duration: z.number(),
  thumbnailUrl: z.string(),
  addedAt: z.number(),
})

const PlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tracks: z.array(TrackSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
})

const RepeatModeSchema = z.enum(["off", "playlist", "one"])

const PlaylistStateSchema = z.object({
  playlists: z.array(PlaylistSchema),
  currentPlaylistId: z.string().nullable(),
  currentTrackIndex: z.number(),
  isShuffleEnabled: z.boolean(),
  shuffleOrder: z.array(z.number()),
  repeatMode: RepeatModeSchema,
})

// Default state for when localStorage is empty or corrupt
const DEFAULT_STATE: PlaylistState = {
  playlists: [],
  currentPlaylistId: null,
  currentTrackIndex: 0,
  isShuffleEnabled: false,
  shuffleOrder: [],
  repeatMode: "off",
}

// Custom storage with Zod validation
const createValidatedStorage = (): PersistStorage<PlaylistState> => {
  const jsonStorage = createJSONStorage<PlaylistState>(() => localStorage)

  // Fallback implementations if jsonStorage is undefined
  const fallbackSetItem = (name: string, value: StorageValue<PlaylistState>) => {
    localStorage.setItem(name, JSON.stringify(value))
  }

  const fallbackRemoveItem = (name: string) => {
    localStorage.removeItem(name)
  }

  return {
    getItem: (name) => {
      try {
        const rawValue = jsonStorage?.getItem(name)

        // Handle both sync and async returns from jsonStorage
        if (rawValue instanceof Promise) {
          return rawValue.then((value) => validateStorageValue(value, name))
        }

        return validateStorageValue(rawValue ?? null, name)
      } catch (error) {
        console.warn(`[playlist-store] Error reading from localStorage: ${error}`)
        return null
      }
    },
    setItem: jsonStorage?.setItem ?? fallbackSetItem,
    removeItem: jsonStorage?.removeItem ?? fallbackRemoveItem,
  }
}

function validateStorageValue(
  value: StorageValue<PlaylistState> | null,
  storageName: string
): StorageValue<PlaylistState> | null {
  if (!value) return null

  try {
    // Validate the state portion of the storage value
    const validatedState = PlaylistStateSchema.parse(value.state)

    // Additional validation: ensure currentTrackIndex is within bounds
    const sanitizedState = sanitizePlaylistState(validatedState)

    return {
      ...value,
      state: sanitizedState,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn(
        `[playlist-store] Corrupt data in localStorage key "${storageName}". Resetting to defaults.`,
        error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      )
    } else {
      console.warn(`[playlist-store] Invalid data in localStorage: ${error}`)
    }

    // Return null to trigger default state initialization
    return null
  }
}

// Clean up duplicate "My Playlist" entries created by legacy initialization bugs
function cleanupLegacyDuplicatePlaylists(state: PlaylistState): PlaylistState {
  const LEGACY_PLAYLIST_NAME = "My Playlist"

  // Find all playlists with the legacy name
  const legacyPlaylists = state.playlists.filter((p) => p.name === LEGACY_PLAYLIST_NAME)

  // If 0 or 1 legacy playlists, nothing to clean up
  if (legacyPlaylists.length <= 1) {
    return state
  }

  console.info(
    `[playlist-store] Found ${legacyPlaylists.length} duplicate "${LEGACY_PLAYLIST_NAME}" playlists. Consolidating...`
  )

  // Keep the one with the most tracks, or if tied, the most recently updated
  const sortedLegacy = [...legacyPlaylists].sort((a, b) => {
    // Prefer more tracks
    if (b.tracks.length !== a.tracks.length) {
      return b.tracks.length - a.tracks.length
    }
    // Then prefer more recently updated
    return b.updatedAt - a.updatedAt
  })

  const keepPlaylist = sortedLegacy[0]!
  const removeIds = new Set(sortedLegacy.slice(1).map((p) => p.id))

  // Filter out duplicates
  const cleanedPlaylists = state.playlists.filter((p) => !removeIds.has(p.id))

  // If current playlist was removed, switch to the kept one or first available
  let newCurrentPlaylistId = state.currentPlaylistId
  if (state.currentPlaylistId && removeIds.has(state.currentPlaylistId)) {
    newCurrentPlaylistId = keepPlaylist.id
  }

  console.info(
    `[playlist-store] Kept "${keepPlaylist.name}" (${keepPlaylist.tracks.length} tracks), removed ${removeIds.size} duplicates.`
  )

  return {
    ...state,
    playlists: cleanedPlaylists,
    currentPlaylistId: newCurrentPlaylistId,
    // Reset playback state if we changed the current playlist
    currentTrackIndex: newCurrentPlaylistId !== state.currentPlaylistId ? 0 : state.currentTrackIndex,
    shuffleOrder: newCurrentPlaylistId !== state.currentPlaylistId ? [] : state.shuffleOrder,
  }
}

// Sanitize the state to fix any logical inconsistencies
function sanitizePlaylistState(state: PlaylistState): PlaylistState {
  let sanitized = { ...state }

  // Migration: Clean up duplicate "My Playlist" entries (legacy bug)
  sanitized = cleanupLegacyDuplicatePlaylists(sanitized)

  // Ensure currentPlaylistId references a valid playlist
  if (sanitized.currentPlaylistId !== null) {
    const playlistExists = sanitized.playlists.some(
      (p) => p.id === sanitized.currentPlaylistId
    )
    if (!playlistExists) {
      sanitized.currentPlaylistId = null
      sanitized.currentTrackIndex = 0
      sanitized.shuffleOrder = []
    }
  }

  // Get current playlist for further validation
  const currentPlaylist = sanitized.currentPlaylistId
    ? sanitized.playlists.find((p) => p.id === sanitized.currentPlaylistId)
    : null

  if (currentPlaylist) {
    const trackCount = currentPlaylist.tracks.length

    // Ensure currentTrackIndex is within bounds
    if (sanitized.currentTrackIndex < 0 || sanitized.currentTrackIndex >= trackCount) {
      sanitized.currentTrackIndex = Math.max(0, Math.min(sanitized.currentTrackIndex, trackCount - 1))
      if (trackCount === 0) sanitized.currentTrackIndex = 0
    }

    // Validate shuffleOrder if shuffle is enabled
    if (sanitized.isShuffleEnabled && sanitized.shuffleOrder.length > 0) {
      const validShuffleOrder = sanitized.shuffleOrder.every(
        (idx) => typeof idx === "number" && idx >= 0 && idx < trackCount
      )

      if (!validShuffleOrder || sanitized.shuffleOrder.length !== trackCount) {
        // Reset shuffle order if invalid
        sanitized.shuffleOrder = []
        sanitized.currentTrackIndex = 0
      }
    }
  } else {
    // No current playlist - reset playback state
    sanitized.currentTrackIndex = 0
    sanitized.shuffleOrder = []
  }

  // Validate repeatMode
  if (!["off", "playlist", "one"].includes(sanitized.repeatMode)) {
    sanitized.repeatMode = "off"
  }

  return sanitized
}

type TrackUpdatableFields = Exclude<keyof Track, "id" | "addedAt">
type TrackUpdate = Partial<Pick<Track, TrackUpdatableFields>>

interface PlaylistActions {
  // Playlist management
  createPlaylist: (name: string, description?: string, initialTracks?: Track[]) => void
  deletePlaylist: (playlistId: string) => void
  updatePlaylist: (playlistId: string, updates: Partial<Omit<Playlist, "id" | "tracks" | "createdAt">>) => void

  // Track management
  addTrackToPlaylist: (playlistId: string, track: Omit<Track, "addedAt">) => void
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void
  moveTrack: (playlistId: string, fromIndex: number, toIndex: number) => void
  updateTrackInfo: (
    playlistId: string,
    trackId: string,
    updates: TrackUpdate
  ) => void

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
      // Initial state (spread from defaults for consistency)
      ...DEFAULT_STATE,

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
        set((state) => {
          const playlists = state.playlists.map((p) =>
            p.id === playlistId
              ? {
                ...p,
                tracks: [...p.tracks, { ...track, addedAt: Date.now() }],
                updatedAt: Date.now(),
              }
              : p
          )

          if (
            state.isShuffleEnabled &&
            state.currentPlaylistId === playlistId
          ) {
            const targetPlaylist = playlists.find((p) => p.id === playlistId)
            const newTrackIndex = targetPlaylist ? targetPlaylist.tracks.length - 1 : -1

            if (newTrackIndex >= 0) {
              const alreadyInOrder = state.shuffleOrder.includes(newTrackIndex)

              if (!alreadyInOrder) {
                const shuffleOrder = [...state.shuffleOrder, newTrackIndex]
                return {
                  playlists,
                  shuffleOrder,
                }
              }
            }
          }

          return { playlists }
        })
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

      updateTrackInfo: (playlistId, trackId, updates) => {
        set((state) => {
          let hasPlaylistBeenUpdated = false

          const playlists = state.playlists.map((playlist) => {
            if (playlist.id !== playlistId) {
              return playlist
            }

            const trackIndex = playlist.tracks.findIndex((track) => track.id === trackId)
            if (trackIndex === -1) {
              return playlist
            }

            const currentTrack = playlist.tracks[trackIndex]
            const nextTrack: Track = { ...currentTrack }
            const mutableTrack = nextTrack as Track &
              Record<TrackUpdatableFields, Track[TrackUpdatableFields]>
            let trackChanged = false
            for (const key of Object.keys(updates) as TrackUpdatableFields[]) {
              const value = updates[key]
              if (typeof value === "undefined") {
                continue
              }

              if (mutableTrack[key] !== value) {
                // TODO: Fix this type error
                mutableTrack[key] = value as never
                trackChanged = true
              }
            }

            if (!trackChanged) {
              return playlist
            }

            const newTracks = [...playlist.tracks]
            newTracks[trackIndex] = nextTrack
            hasPlaylistBeenUpdated = true

            return {
              ...playlist,
              tracks: newTracks,
              updatedAt: Date.now(),
            }
          })

          if (!hasPlaylistBeenUpdated) {
            return state
          }

          return { playlists }
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
          if (state.isShuffleEnabled && state.shuffleOrder.length > 0) {
            // In shuffle mode, index passed in is the actual track index
            // We need to convert it shuffle order index
            const shuffleOrderIndex = state.shuffleOrder.indexOf(index)

            if (shuffleOrderIndex !== -1) {
              set({ currentTrackIndex: shuffleOrderIndex })
            } else {
              const updatedOrder = [...state.shuffleOrder, index]
              set({
                shuffleOrder: updatedOrder,
                currentTrackIndex: updatedOrder.length - 1,
              })
            }
          } else {
            // In normal mode, set the current track index directly
            set({ currentTrackIndex: index })
          }
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
      storage: createValidatedStorage(),
    }
  )
)
