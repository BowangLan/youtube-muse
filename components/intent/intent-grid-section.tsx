"use client";

import * as React from "react";
import type { Playlist } from "@/lib/types/playlist";
import { getIntentByName } from "@/lib/intents";
import { IntentCard } from "./intent-card";
import { cn } from "@/lib/utils";

export function IntentGridSection({
  intentPlaylists,
  currentPlaylistId,
  onOpenIntent,
}: {
  intentPlaylists: Playlist[];
  currentPlaylistId: string | null;
  onOpenIntent: (playlistId: string) => void;
}) {
  return (
    <section
      aria-label="Intent Grid"
      className="space-y-6 md:space-y-8 motion-preset-slide-up-sm"
    >
      <div className={cn("grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4")}>
        {intentPlaylists.slice(0, 9).map((playlist, index) => {
          const intent = getIntentByName(playlist.name);
          const isActive = currentPlaylistId === playlist.id;

          return (
            <div
              key={playlist.id}
              className={cn(
                "motion-preset-blur-up-lg"
                // `motion-delay-[${index * 100}ms]`
              )}
              style={
                {
                  "--motion-delay": `${index * 100}ms`,
                } as React.CSSProperties
              }
            >
              <IntentCard
                playlist={playlist}
                intent={intent}
                isActive={isActive}
                onClick={() => onOpenIntent(playlist.id)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
