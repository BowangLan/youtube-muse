import { create } from "zustand";

export type V4Tab = "intents" | "channels" | "intent-detail" | "search";
export type V4DetailTab = "intent-detail" | "playlist-detail";
export type V4TabWithDetail = V4Tab | "playlist-detail";

export type V4AppState = {
  activeTab: V4TabWithDetail;
  activePlaylistId: string | null;
  isFocusMode: boolean;
  sidebarCollapsed: boolean;
  setIsFocusMode: (isFocusMode: boolean) => void;
};

export type V4AppStateActions = {
  setActiveTab: (tab: V4TabWithDetail) => void;
  setActivePlaylist: (id: string | null) => void;
  openIntentDetail: (playlistId: string) => void;
  openPlaylistDetail: (playlistId: string) => void;
  closeIntentDetail: () => void;
  closePlaylistDetail: () => void;
  openSearch: () => void;
  closeSearch: () => void;

  setIsFocusMode: (isFocusMode: boolean) => void;
  toggleSidebar: () => void;
};

export const useV4AppStateStore = create<V4AppState & V4AppStateActions>(
  (set) => ({
    activeTab: "intents",
    activePlaylistId: null,
    isFocusMode: false,
    sidebarCollapsed: false,
    setActiveTab: (tab) => set({ activeTab: tab }),
    setActivePlaylist: (id) => set({ activePlaylistId: id }),
    openIntentDetail: (playlistId) =>
      set({ activeTab: "intent-detail", activePlaylistId: playlistId }),
    openPlaylistDetail: (playlistId) =>
      set({ activeTab: "playlist-detail", activePlaylistId: playlistId }),
    closeIntentDetail: () =>
      set({ activeTab: "intents", activePlaylistId: null }),
    closePlaylistDetail: () =>
      set({ activeTab: "intents", activePlaylistId: null }),
    openSearch: () => set({ activeTab: "search" }),
    closeSearch: () => set({ activeTab: "intents" }),
    setIsFocusMode: (isFocusMode) => set({ isFocusMode }),
    toggleSidebar: () =>
      set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  })
);
