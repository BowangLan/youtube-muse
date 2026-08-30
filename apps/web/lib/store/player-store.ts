import { create } from "zustand";
import type { PlayerAction, PlayerState } from "@/lib/player-core/types";
import { createPlaybackSession } from "@/lib/playback-session/session";
import { usePlaylistStore } from "@/lib/store/playlist-store";

export const playbackSession = createPlaybackSession({
  queue: {
    next: () => usePlaylistStore.getState().playNext(),
    previous: () => usePlaylistStore.getState().playPrevious(),
    repeatMode: () => usePlaylistStore.getState().repeatMode,
  },
});

interface PlayerStore extends PlayerState {
  dispatch: (event: PlayerAction) => void;
}

// Compatibility view: controls retain the same state and dispatch.
export const usePlayerStore = create<PlayerStore>(() => ({
  ...playbackSession.getState(),
  dispatch: playbackSession.dispatch,
}));

playbackSession.subscribe((state) => usePlayerStore.setState(state));
