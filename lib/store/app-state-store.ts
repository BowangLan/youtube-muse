import { create } from "zustand"

export type ViewMode = "grid" | "intent" | "stream"

export type AppState = {
  isFocused: boolean
  view: ViewMode
  activePlaylistId: string | null
}

export type AppStateActions = {
  toggleFocus: () => void
  setView: (view: ViewMode) => void
  setActivePlaylist: (id: string | null) => void
  openIntent: (playlistId: string) => void
  openStream: (playlistId: string) => void
  closeIntent: () => void
}

export const useAppStateStore = create<AppState & AppStateActions>((set) => ({
  isFocused: false,
  view: "grid",
  activePlaylistId: null,
  toggleFocus: () => set((state) => ({ isFocused: !state.isFocused })),
  setView: (view) => set({ view }),
  setActivePlaylist: (id) => set({ activePlaylistId: id }),
  openIntent: (playlistId) => set({ activePlaylistId: playlistId, view: "intent" }),
  openStream: (playlistId) => set({ activePlaylistId: playlistId, view: "stream" }),
  closeIntent: () => set({ view: "grid" }),
}))