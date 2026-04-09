import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface CustomPlaylistsState {
  customPlaylistIds: string[]
  lastUsedPlaylistId: string | null
}

interface CustomPlaylistsActions {
  addCustomPlaylist: (playlistId: string) => void
  removeCustomPlaylist: (playlistId: string) => void
  setCustomPlaylistOrder: (playlistIds: string[]) => void
  isCustomPlaylist: (playlistId: string) => boolean
  setLastUsedPlaylist: (playlistId: string | null) => void
}

export const useCustomPlaylistsStore = create<
  CustomPlaylistsState & CustomPlaylistsActions
>()(
  persist(
    (set, get) => ({
      customPlaylistIds: [],
      lastUsedPlaylistId: null,

      addCustomPlaylist: (playlistId) => {
        set((state) => ({
          customPlaylistIds: state.customPlaylistIds.includes(playlistId)
            ? state.customPlaylistIds
            : [...state.customPlaylistIds, playlistId],
        }))
      },

      removeCustomPlaylist: (playlistId) => {
        set((state) => {
          const nextIds = state.customPlaylistIds.filter((id) => id !== playlistId)
          return {
            customPlaylistIds: nextIds,
            lastUsedPlaylistId:
              state.lastUsedPlaylistId === playlistId
                ? nextIds[nextIds.length - 1] ?? null
                : state.lastUsedPlaylistId,
          }
        })
      },

      setCustomPlaylistOrder: (playlistIds) => {
        const uniqueIds = Array.from(new Set(playlistIds))
        set((state) => ({
          customPlaylistIds: uniqueIds,
          lastUsedPlaylistId:
            state.lastUsedPlaylistId && uniqueIds.includes(state.lastUsedPlaylistId)
              ? state.lastUsedPlaylistId
              : uniqueIds[uniqueIds.length - 1] ?? null,
        }))
      },

      isCustomPlaylist: (playlistId) => {
        return get().customPlaylistIds.includes(playlistId)
      },

      setLastUsedPlaylist: (playlistId) => {
        set((state) => ({
          lastUsedPlaylistId:
            playlistId && state.customPlaylistIds.includes(playlistId)
              ? playlistId
              : playlistId === null
                ? null
                : state.lastUsedPlaylistId,
        }))
      },
    }),
    {
      name: "custom-playlists-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)
