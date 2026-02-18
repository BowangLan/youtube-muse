import { create } from "zustand";

export type V4Tab = "intents" | "channels" | "intent-detail";

export type V4AppState = {
  activeTab: V4Tab;
  activePlaylistId: string | null;
};

export type V4AppStateActions = {
  setActiveTab: (tab: V4Tab) => void;
  setActivePlaylist: (id: string | null) => void;
  openIntentDetail: (playlistId: string) => void;
  closeIntentDetail: () => void;
};

export const useV4AppStateStore = create<V4AppState & V4AppStateActions>(
  (set) => ({
    activeTab: "intents",
    activePlaylistId: null,
    setActiveTab: (tab) => set({ activeTab: tab }),
    setActivePlaylist: (id) => set({ activePlaylistId: id }),
    openIntentDetail: (playlistId) =>
      set({ activeTab: "intent-detail", activePlaylistId: playlistId }),
    closeIntentDetail: () =>
      set({ activeTab: "intents", activePlaylistId: null }),
  })
);
