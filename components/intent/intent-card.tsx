"use client";

import * as React from "react";
import type { Playlist } from "@/lib/types/playlist";
import type { IntentDefinition } from "@/lib/intents";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/lib/store/player-store";
import { Button } from "../ui/button";

interface IntentCardProps {
  playlist: Playlist;
  intent: IntentDefinition | undefined;
  isActive: boolean;
  onClick: () => void;
}

export function IntentCard({
  playlist,
  intent,
  isActive,
  onClick,
}: IntentCardProps) {
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const trackCount = playlist.tracks.length;

  const isCurrentlyPlaying = isActive && isPlaying;

  return (
    <button
      type="button"
      onClick={onClick}
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

      <div className="relative z-10 space-y-1">
        <div className="text-[10px]/[12px] md:text-xs/tight uppercase tracking-[0.32em] text-white/50">
          Intent
        </div>
        <div className="text-base/tight md:text-lg/tight font-normal text-white">
          {playlist.name}
        </div>
        <div className="line-clamp-2 text-[11px]/[13px] md:text-xs/tight text-white/45">
          {intent?.description ?? ""}
        </div>
      </div>
      <div className="relative z-10 flex items-center justify-between text-xs text-white/45">
        <span>{trackCount} tracks</span>
        <span
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white/30"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClick();
          }}
        >
          tap to enter
        </span>
      </div>
    </button>
  );
}
