import { create } from "zustand"
import type { YTPlayer } from "@/lib/types/youtube"

interface YouTubePlayerInstanceState {
  player: YTPlayer | null
  videoMode: YouTubePlayerMode
  hostElement: HTMLElement | null
}

interface YouTubePlayerInstanceActions {
  setPlayer: (player: YTPlayer) => void
  getPlayer: () => YTPlayer | null
  clearPlayer: () => void
  setVideoMode: (mode: YouTubePlayerMode) => void
  toggleVideoMode: () => void
  setHostElement: (host: HTMLElement | null) => void
}

type YouTubePlayerInstanceStore = YouTubePlayerInstanceState & YouTubePlayerInstanceActions

export type YouTubePlayerMode = "hidden" | "floating" | "fullscreen"

export const useYouTubePlayerInstanceStore = create<YouTubePlayerInstanceStore>((set, get) => ({
  player: null,
  videoMode: "hidden",
  hostElement: null,

  setPlayer: (player) => set({ player }),

  getPlayer: () => get().player,

  clearPlayer: () => set({ player: null }),

  setVideoMode: (mode) => set({ videoMode: mode }),

  toggleVideoMode: () =>
    set((state) => ({
      videoMode: state.videoMode === "hidden" ? "floating" : "hidden",
    })),

  setHostElement: (host) => set({ hostElement: host }),
}))
