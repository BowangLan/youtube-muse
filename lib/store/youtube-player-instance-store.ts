import { create } from "zustand"
import type { YTPlayer } from "@/lib/types/youtube"

interface YouTubePlayerInstanceState {
  player: YTPlayer | null
  videoMode: YouTubePlayerMode
  hostElement: HTMLElement | null
  preferredQuality: string
  currentQuality: string
  availableQualities: string[]
}

interface YouTubePlayerInstanceActions {
  setPlayer: (player: YTPlayer) => void
  getPlayer: () => YTPlayer | null
  clearPlayer: () => void
  setVideoMode: (mode: YouTubePlayerMode) => void
  toggleVideoMode: () => void
  setHostElement: (host: HTMLElement | null) => void
  setPreferredQuality: (quality: string) => void
  setCurrentQuality: (quality: string) => void
  setAvailableQualities: (qualities: string[]) => void
  getQualityForMode: (mode: YouTubePlayerMode) => string
}

type YouTubePlayerInstanceStore = YouTubePlayerInstanceState & YouTubePlayerInstanceActions

export type YouTubePlayerMode = "hidden" | "floating" | "fullscreen"

export const useYouTubePlayerInstanceStore = create<YouTubePlayerInstanceStore>((set, get) => ({
  player: null,
  videoMode: "hidden",
  hostElement: null,
  preferredQuality: "hd1080",
  currentQuality: "small",
  availableQualities: [],

  setPlayer: (player) => set({ player }),

  getPlayer: () => get().player,

  clearPlayer: () => set({ player: null }),

  setVideoMode: (mode) => set({ videoMode: mode }),

  toggleVideoMode: () =>
    set((state) => ({
      videoMode: state.videoMode === "hidden" ? "floating" : "hidden",
    })),

  setHostElement: (host) => set({ hostElement: host }),

  setPreferredQuality: (quality) => set({ preferredQuality: quality }),

  setCurrentQuality: (quality) => set({ currentQuality: quality }),

  setAvailableQualities: (qualities) => set({ availableQualities: qualities }),

  getQualityForMode: (mode) => {
    const state = get()
    if (mode === "hidden" || mode === "floating") {
      return "small"
    }
    // For fullscreen, use preferred quality or best available
    if (state.availableQualities.length === 0) {
      return state.preferredQuality
    }
    // Check if preferred quality is available
    if (state.availableQualities.includes(state.preferredQuality)) {
      return state.preferredQuality
    }
    // Return the best available quality
    const qualityOrder = ["hd2160", "hd1440", "hd1080", "hd720", "large", "medium", "small", "tiny"]
    for (const quality of qualityOrder) {
      if (state.availableQualities.includes(quality)) {
        return quality
      }
    }
    return state.preferredQuality
  },
}))
