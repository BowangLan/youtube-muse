"use client";

import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { PlayerControls } from "./player-controls";
import { CurrentTrackHeader } from "./current-track-header";

export function AnimatedPlayerHeader() {
  const track = usePlaylistStore((state) => state.getCurrentTrack());
  const apiReady = usePlayerStore((state) => state.apiReady);

  if (!apiReady) {
    return null;
  }

  return (
    <>
      {!track ? (
        <div className="flex flex-col gap-4 text-left text-neutral-500">
          <span className="text-xs uppercase tracking-[0.4em]">
            queue empty
          </span>
          <p className="text-2xl text-white">Drop a link to begin.</p>
        </div>
      ) : (
        <div id="player-header" className="space-y-6">
          {/* Album art & track info */}
          <CurrentTrackHeader track={track} />

          {/* Player controls */}
          <PlayerControls />
        </div>
      )}
    </>
  );
}
