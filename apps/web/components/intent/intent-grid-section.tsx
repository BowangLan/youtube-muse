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
    (state) => state.intentMetadataByPlaylistId,
  );

  return (
    <section aria-label="Intent Grid" className="space-y-6 md:space-y-8">
      <div
        className={cn("grid gap-4 md:gap-5")}
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        }}
      >
        {intentPlaylists.map((playlist, index) => {
          const intent = intentMetadataByPlaylistId[playlist.id];

          return (
            <motion.div
              key={playlist.id}
              className={cn(
                "motion-blur-in-md motion-translate-y-in-[15%] motion-opacity-in-0 motion-duration-500",
              )}
              style={
                {
                  "--motion-delay": `${index * 40}ms`,
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
          className="motion-preset-blur-up-md"
          style={
            {
              "--motion-delay": `${intentPlaylists.length * 40}ms`,
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
