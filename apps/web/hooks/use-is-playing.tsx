import { usePlayerStore } from "@/lib/store/player-store";

export function useIsPlaying() {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const pendingPlayState = usePlayerStore((state) => state.pendingPlayState);
  const observedPlayback = usePlayerStore((state) => state.observedPlayback);

  // Only show as "playing" if actually playing, or if pending play during buffering/loading states
  // Don't show as playing if stuck in "cued" or "paused" (e.g., due to browser autoplay restrictions)
  const _isPlaying = isPlaying || (pendingPlayState === true && observedPlayback === "buffering");
  return _isPlaying;
}
