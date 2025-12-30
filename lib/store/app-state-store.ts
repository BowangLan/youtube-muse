import { create } from "zustand"

export type ViewMode = "grid" | "intent" | "stream"
export type GridTab = "intents" | "streams"

export type AppState = {
  isFocused: boolean
  view: ViewMode
  activePlaylistId: string | null
  gridTab: GridTab
}

export type AppStateActions = {
  toggleFocus: () => void
  setView: (view: ViewMode) => void
  setActivePlaylist: (id: string | null) => void
  setGridTab: (tab: GridTab) => void
  openIntent: (playlistId: string) => void
  openStream: (playlistId: string) => void
  returnToGrid: (tab?: GridTab) => void
  closeIntent: () => void
}

export const useAppStateStore = create<AppState & AppStateActions>((set) => ({
  isFocused: false,
  view: "grid",
  activePlaylistId: null,
  gridTab: "intents",
  toggleFocus: () => set((state) => ({ isFocused: !state.isFocused })),
  setView: (view) => set({ view }),
  setActivePlaylist: (id) => set({ activePlaylistId: id }),
  setGridTab: (tab) => set({ gridTab: tab }),
  openIntent: (playlistId) =>
    set({ activePlaylistId: playlistId, view: "intent", gridTab: "intents" }),
  openStream: (playlistId) =>
    set({ activePlaylistId: playlistId, view: "stream", gridTab: "streams" }),
  returnToGrid: (tab) =>
    set((state) => ({
      view: "grid",
      activePlaylistId: null,
      gridTab: tab ?? state.gridTab,
    })),
  closeIntent: () => set({ view: "grid" }),
}))
