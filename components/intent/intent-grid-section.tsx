"use client";

import * as React from "react";
import type { Playlist } from "@/lib/types/playlist";
import { getIntentByName } from "@/lib/intents";
import {
  useCustomIntentsStore,
  type CustomIntent,
} from "@/lib/store/custom-intents-store";
import { IntentCard } from "./intent-card";
import { CreateIntentDialog } from "./create-intent-dialog";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "motion/react";
import { EASING_DURATION_CARD, EASING_EASE_OUT } from "@/lib/styles/animation";

export function IntentGridSection({
  intentPlaylists,
  customIntentPlaylists = [],
}: {
  intentPlaylists: Playlist[];
  customIntentPlaylists?: Playlist[];
}) {
  const reduceMotion = useReducedMotion();
  const customIntents = useCustomIntentsStore((state) => state.customIntents);

  // Get custom intent definition for a playlist
  const getCustomIntent = (playlist: Playlist): CustomIntent | undefined => {
    return customIntents.find((ci) => ci.playlistId === playlist.id);
  };

  // Combine built-in and custom playlists
  const allPlaylists = [...intentPlaylists, ...customIntentPlaylists];

  return (
    <section aria-label="Intent Grid" className="space-y-6 md:space-y-8">
      <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4")}>
        {allPlaylists.map((playlist, index) => {
          // First try built-in intent, then custom intent
          const intent =
            getIntentByName(playlist.name) ?? getCustomIntent(playlist);

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
              "--motion-delay": `${allPlaylists.length * 100}ms`,
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
