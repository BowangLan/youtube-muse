import { usePlayerStore } from "@/lib/store/player-store";

export function useIsPlaying() {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const pendingPlayState = usePlayerStore((state) => state.pendingPlayState);
  const _isPlaying = isPlaying || pendingPlayState !== null;
  return _isPlaying;
}
