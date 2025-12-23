"use client";

import * as React from "react";
import type { Playlist } from "@/lib/types/playlist";
import { getIntentByName } from "@/lib/intents";
import { IntentCard } from "./intent-card";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { EASING_DURATION_CARD, EASING_EASE_OUT } from "@/lib/styles/animation";

export function IntentGridSection({
  intentPlaylists,
}: {
  intentPlaylists: Playlist[];
}) {
  return (
    <section
      aria-label="Intent Grid"
      className="space-y-6 md:space-y-8 motion-preset-slide-up-sm"
    >
      <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4")}>
        {intentPlaylists.slice(0, 9).map((playlist, index) => {
          const intent = getIntentByName(playlist.name);

          return (
            <motion.div
              key={playlist.id}
              className={
                cn()
                // "motion-preset-blur-up-lg"
                // `motion-delay-[${index * 100}ms]`
              }
              style={
                {
                  "--motion-delay": `${index * 100}ms`,
                } as React.CSSProperties
              }
              layout
              layoutId={`intent-detail-section-${playlist.id}`}
              transition={{
                duration: EASING_DURATION_CARD,
                ease: EASING_EASE_OUT,
              }}
            >
              <IntentCard playlist={playlist} intent={intent} />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
