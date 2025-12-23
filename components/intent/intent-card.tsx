"use client";

import * as React from "react";
import type { Playlist } from "@/lib/types/playlist";
import type { IntentDefinition } from "@/lib/intents";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/lib/store/player-store";
import { useAppStateStore } from "@/lib/store/app-state-store";
import { motion } from "motion/react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { EASING_DURATION_CARD, EASING_EASE_OUT } from "@/lib/styles/animation";

interface IntentCardProps {
  playlist: Playlist;
  intent: IntentDefinition | undefined;
}

export function IntentCard({ playlist, intent }: IntentCardProps) {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const openIntent = useAppStateStore((state) => state.openIntent);
  const trackCount = playlist.tracks.length;
  const openIntentAction = useAppStateStore((state) => state.openIntent);
  const setCurrentPlaylist = usePlaylistStore(
    (state) => state.setCurrentPlaylist
  );
  const setCurrentTrackIndex = usePlaylistStore(
    (state) => state.setCurrentTrackIndex
  );
  const currentPlaylistId = usePlaylistStore(
    (state) => state.currentPlaylistId
  );

  const isActive = currentPlaylistId === playlist.id;

  const isCurrentlyPlaying = isActive && isPlaying;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (isActive) {
          togglePlay();
        } else {
          setCurrentPlaylist(playlist.id);
          setCurrentTrackIndex(0);
        }
      }}
      className={cn(
        "relative group trans w-full flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl bg-white/3 p-4 text-left",
        "transition-colors hover:bg-white/6 active:bg-white/8",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-linear-to-br before:opacity-90 before:transition-opacity before:duration-300",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[radial-gradient(60%_60%_at_20%_10%,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.02)_45%,transparent_70%)] after:opacity-50",
        isActive ? "intent-card-active" : "intent-card",
        intent?.gradientClassName &&
          (isActive
            ? `${intent.gradientClassName}-active`
            : intent.gradientClassName)
      )}
    >
      {/* Play State Indicator */}
      {isActive && (
        <div className="absolute top-4 right-4 z-20">
          <div className="flex items-end gap-[3px] h-3">
            <div
              className={cn(
                "w-[3px] rounded-full bg-white/90",
                isCurrentlyPlaying
                  ? "h-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-0"
                  : "h-1"
              )}
              style={{
                animationPlayState: isCurrentlyPlaying ? "running" : "paused",
              }}
            />
            <div
              className={cn(
                "w-[3px] rounded-full bg-white/90",
                isCurrentlyPlaying
                  ? "h-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-150"
                  : "h-2"
              )}
              style={{
                animationPlayState: isCurrentlyPlaying ? "running" : "paused",
              }}
            />
            <div
              className={cn(
                "w-[3px] rounded-full bg-white/90",
                isCurrentlyPlaying
                  ? "h-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-300"
                  : "h-1.5"
              )}
              style={{
                animationPlayState: isCurrentlyPlaying ? "running" : "paused",
              }}
            />
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-1">
        <div className="text-[10px]/[12px] md:text-xs/tight uppercase tracking-[0.32em] text-white/50">
          Intent
        </div>
        <motion.div
          className="text-base/tight md:text-lg/tight font-normal text-white"
          layoutId={`intent-name-${playlist.id}`}
          layout="position"
          transition={{ duration: EASING_DURATION_CARD, ease: EASING_EASE_OUT }}
        >
          {playlist.name}
        </motion.div>
        <div className="line-clamp-2 text-[11px]/[13px] md:text-xs/tight text-white/45">
          {intent?.description ?? ""}
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between text-xs text-white/45">
        <span>{trackCount} tracks</span>
        <span
          className="md:opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white/30 hover:text-white trans select-none cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            openIntent(playlist.id);
          }}
        >
          tap to enter
        </span>
      </div>
    </button>
  );
}
