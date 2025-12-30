"use client";

import * as React from "react";
import type { Playlist } from "@/lib/types/playlist";
import { useStreamsStore } from "@/lib/store/streams-store";
import { StreamCard } from "./stream-card";
import { CreateStreamDialog } from "./create-stream-dialog";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { EASING_DURATION_CARD, EASING_EASE_OUT } from "@/lib/styles/animation";

export function StreamGridSection({
  streamPlaylists = [],
}: {
  streamPlaylists?: Playlist[];
}) {
  const reduceMotion = useReducedMotion();
  const streams = useStreamsStore((state) => state.streams);

  // Get stream for a playlist
  const getStream = (playlist: Playlist) => {
    return streams.find((s) => s.playlistId === playlist.id);
  };

  // Only show section if there are streams or no streams at all (to show create button)
  if (streamPlaylists.length === 0 && streams.length > 0) {
    return null;
  }

  return (
    <section aria-label="Stream Grid" className="space-y-6 md:space-y-8">
      <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4")}>
        {streamPlaylists.map((playlist, index) => {
          const stream = getStream(playlist);
          if (!stream) return null;

          return (
            <motion.div
              key={playlist.id}
              layout
              className={cn(
                "motion-preset-blur-up-lg",
                `motion-delay-[${index * 50}ms]`
              )}
              style={
                {
                  "--motion-delay": `${index * 50}ms`,
                } as React.CSSProperties
              }
              transition={{
                duration: reduceMotion ? 0 : EASING_DURATION_CARD,
                ease: reduceMotion ? "linear" : EASING_EASE_OUT,
              }}
            >
              <StreamCard playlist={playlist} stream={stream} />
            </motion.div>
          );
        })}

        {/* Create Stream Button */}
        <motion.div
          key="create-stream"
          style={
            {
              "--motion-delay": `${streamPlaylists.length * 100}ms`,
            } as React.CSSProperties
          }
          layout
          transition={{
            duration: reduceMotion ? 0 : EASING_DURATION_CARD,
            ease: reduceMotion ? "linear" : EASING_EASE_OUT,
          }}
        >
          <CreateStreamDialog />
        </motion.div>
      </div>
    </section>
  );
}
