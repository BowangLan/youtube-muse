"use client";

import * as React from "react";
import type { Playlist } from "@/lib/types/playlist";
import type { IntentMetadata } from "@/lib/store/custom-intents-store";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/lib/store/player-store";
import { useAppStateStore } from "@/lib/store/app-state-store";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { EASING_DURATION_CARD, EASING_EASE_OUT } from "@/lib/styles/animation";
import { Icons } from "../icons";
import { useIsPlaying } from "@/hooks/use-is-playing";

interface IntentCardProps {
  playlist: Playlist;
  intent: IntentMetadata | undefined;
}

export function IntentCard({ playlist, intent }: IntentCardProps) {
  const reduceMotion = useReducedMotion();
  const dispatch = usePlayerStore((state) => state.dispatch);
  const openIntent = useAppStateStore((state) => state.openIntent);
  const trackCount = playlist.tracks.length;
  const setCurrentPlaylist = usePlaylistStore(
    (state) => state.setCurrentPlaylist
  );
  const setCurrentTrackIndex = usePlaylistStore(
    (state) => state.setCurrentTrackIndex
  );
  const currentPlaylistId = usePlaylistStore(
    (state) => state.currentPlaylistId
  );
  const gradientOverrides = useCustomIntentsStore(
    (state) => state.gradientOverrides
  );

  const isPlaying = useIsPlaying();

  const isActive = currentPlaylistId === playlist.id;

  const isCurrentlyPlaying = isActive && isPlaying;

  // Get gradient - check for override first, then use intent's default
  const gradientClassName =
    gradientOverrides[playlist.id] ?? intent?.gradientClassName;

  return (
    <div
      className={cn(
        "relative group trans w-full flex min-h-36 flex-col justify-between overflow-hidden rounded-2xl bg-white/3 p-4 text-left sm:min-h-40",
        "hover:scale-[101%]",
        "transition-colors hover:bg-white/6 active:bg-white/8",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-linear-to-br before:opacity-90 before:transition-opacity before:duration-300",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[radial-gradient(60%_60%_at_20%_10%,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.02)_45%,transparent_70%)] after:opacity-50",
        "active:scale-95",
        isActive ? "intent-card-active" : "intent-card",
        gradientClassName &&
        (isActive ? `${gradientClassName}-active` : gradientClassName)
      )}
    >
      <button
        type="button"
        aria-label={`Open ${playlist.name} intent`}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          openIntent(playlist.id);
        }}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/60"
      />

      {/* Play/Pause Button */}
      <div className="absolute hidden sm:block top-3 right-3 z-30 opacity-70 group-hover:opacity-100 group-focus-within:opacity-100 trans duration-300">
        <button
          type="button"
          aria-label={
            isCurrentlyPlaying
              ? `Pause ${playlist.name} playlist`
              : `Play ${playlist.name} playlist`
          }
          aria-pressed={isCurrentlyPlaying}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (isActive) {
              dispatch({ type: "UserTogglePlay" });
            } else {
              setCurrentPlaylist(playlist.id);
              setCurrentTrackIndex(0);
            }
          }}
          className="p-2 z-10 rounded-full hover:bg-white/10 hover:scale-110 trans flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/60"
        >
          {isCurrentlyPlaying ? (
            <Icons.Pause className="size-5" />
          ) : (
            <Icons.Play className="size-5 translate-x-px" />
          )}
        </button>
      </div>

      {/* Mobile Play/Pause Button */}
      <div className="absolute bottom-2 right-3 z-30 block sm:hidden">
        <button
          type="button"
          aria-label={
            isCurrentlyPlaying
              ? `Pause ${playlist.name} playlist`
              : `Play ${playlist.name} playlist`
          }
          aria-pressed={isCurrentlyPlaying}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            if (isActive) {
              dispatch({ type: "UserTogglePlay" });
            } else {
              setCurrentPlaylist(playlist.id);
              setCurrentTrackIndex(0);
            }
          }}
          className="z-10 flex h-10 w-10 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-white/10 active:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/60"
        >
          {isCurrentlyPlaying ? (
            <Icons.Pause className="size-5" />
          ) : (
            <Icons.Play className="size-5 translate-x-px" />
          )}
        </button>
      </div>

      <div className="relative z-20 pointer-events-none flex flex-col gap-1">
        <div className="relative flex items-center gap-2">
          <AnimatePresence>
            {isActive && (
              <motion.div
                className="flex items-end gap-[3px] h-3 group-hover:opacity-0 transition-opacity duration-300 opacity-100 pointer-events-none"
                // layoutId="playing-indicator"
                // layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className={cn(
                    "w-[3px] rounded-full bg-white/90 h-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-0"
                  )}
                  style={{
                    animationPlayState: isCurrentlyPlaying
                      ? "running"
                      : "paused",
                  }}
                />
                <div
                  className={cn(
                    "w-[3px] rounded-full bg-white/90 h-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-150"
                  )}
                  style={{
                    animationPlayState: isCurrentlyPlaying
                      ? "running"
                      : "paused",
                  }}
                />
                <div
                  className={cn(
                    "w-[3px] rounded-full bg-white/90 h-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-300"
                  )}
                  style={{
                    animationPlayState: isCurrentlyPlaying
                      ? "running"
                      : "paused",
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <motion.div
            className={cn("text-lg/tight md:text-xl/tight font-normal text-foreground trans", isActive ? "text-primary" : "text-foreground/80 hover:text-foreground")}
            layoutId={`intent-name-${playlist.id}`}
            layout="position"
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: EASING_DURATION_CARD, ease: EASING_EASE_OUT }
            }
          >
            {playlist.name}
          </motion.div>
        </div>
        <div className="line-clamp-2 text-[12px]/[16px] text-muted-foreground md:text-xs/tight">
          {intent?.description ?? ""}
        </div>
      </div>
      <div className="relative z-20 pointer-events-none flex items-center justify-between text-xs text-muted-foreground font-mono">
        <span>{trackCount} tracks</span>
      </div>
    </div>
  );
}
