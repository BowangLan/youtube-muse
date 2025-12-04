"use client";

import * as React from "react";
import { usePlayerStore } from "@/lib/store/player-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";

export function AnimatedBackground() {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const getCurrentTrack = usePlaylistStore((state) => state.getCurrentTrack);
  const currentTrack = getCurrentTrack();

  const thumbnailUrl = currentTrack?.thumbnailUrl;

  return (
    <>
      {/* Fixed background container */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Static base background */}
        <div className="absolute inset-0 bg-[#050505]" />

        {/* Blurred thumbnail background - always visible */}
        {thumbnailUrl && (
          <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
            {/* Multiple blurred layers for depth */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${thumbnailUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                filter: "blur(80px)",
                opacity: 0.4,
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${thumbnailUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                filter: "blur(120px)",
                opacity: 0.3,
              }}
            />

            {/* Dark overlay on top of the blurred images */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
          </div>
        )}
      </div>
    </>
  );
}
