"use client";

import * as React from "react";
import type { Playlist } from "@/lib/types/playlist";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { IntentCard } from "./intent-card";
import { CreateIntentDialog } from "./create-intent-dialog";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { EASING_DURATION_CARD, EASING_EASE_OUT } from "@/lib/styles/animation";

export function IntentGridSection({
  intentPlaylists,
}: {
  intentPlaylists: Playlist[];
}) {
  const reduceMotion = useReducedMotion();
  const intentMetadataByPlaylistId = useCustomIntentsStore(
    (state) => state.intentMetadataByPlaylistId
  );

  return (
    <section aria-label="Intent Grid" className="space-y-6 md:space-y-8">
      <div
        className={cn(
          "grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 md:gap-4"
        )}
      >
        {intentPlaylists.map((playlist, index) => {
          const intent = intentMetadataByPlaylistId[playlist.id];

          return (
            <motion.div
              key={playlist.id}
              className={cn(
                "motion-preset-blur-up-lg",
                `motion-delay-[${index * 50}ms]`
              )}
              style={
                {
                  "--motion-delay": `${index * 50}ms`,
                } as React.CSSProperties
              }
              layout
              layoutId={`intent-detail-section-${playlist.id}`}
              transition={{
                duration: reduceMotion ? 0 : EASING_DURATION_CARD,
                ease: reduceMotion ? "linear" : EASING_EASE_OUT,
              }}
            >
              <IntentCard playlist={playlist} intent={intent} />
            </motion.div>
          );
        })}

        {/* Create Intent Button */}
        <motion.div
          key="create-intent"
          style={
            {
              "--motion-delay": `${intentPlaylists.length * 100}ms`,
            } as React.CSSProperties
          }
          layout
          transition={{
            duration: reduceMotion ? 0 : EASING_DURATION_CARD,
            ease: reduceMotion ? "linear" : EASING_EASE_OUT,
          }}
        >
          <CreateIntentDialog />
        </motion.div>
      </div>
    </section>
  );
}
