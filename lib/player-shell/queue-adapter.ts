import { usePlaylistStore } from "@/lib/store/playlist-store"
import type { RepeatMode } from "@/lib/types/playlist"

export interface QueueAdapter {
  next: () => void
  previous: () => void
  getRepeatMode?: () => RepeatMode
}

export const createPlaylistQueueAdapter = (): QueueAdapter => {
  return {
    next: () => {
      usePlaylistStore.getState().playNext()
    },
    previous: () => {
      usePlaylistStore.getState().playPrevious()
    },
    getRepeatMode: () => usePlaylistStore.getState().repeatMode,
  }
}
