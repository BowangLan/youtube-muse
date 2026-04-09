"use client";

import { usePlaylistStore } from "@/lib/store/playlist-store";
import { PlayerControls } from "./player-controls";
import { CurrentTrackHeader } from "./current-track-header";

export function AnimatedPlayerHeader() {
  const track = usePlaylistStore((state) => state.getCurrentTrack());

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
        <div id="player-header" className="space-y-6 md:space-y-8">
          {/* Album art & track info */}
          <CurrentTrackHeader track={track} />

          {/* Player controls */}
          <PlayerControls />
        </div>
      )}
    </>
  );
}
