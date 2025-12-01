"use client";

import * as React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Shuffle,
  Repeat,
  Repeat1,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils/youtube";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { motion } from "motion/react";

type PlayerToggleButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

function PlayerToggleButton({
  active = false,
  className,
  type = "button",
  "aria-pressed": ariaPressed,
  ...props
}: PlayerToggleButtonProps) {
  return (
    <button
      type={type}
      aria-pressed={ariaPressed ?? active}
      className={cn(
        "flex group/toggle-button items-center gap-2 px-2 py-2 sm:px-3 sm:py-2 rounded-lg hover:bg-white/10 relative trans cursor-pointer motion-preset-blur-up-md motion-delay-500 hover:scale-105 active:scale-95 select-none",
        active ? "text-white" : "text-neutral-500 hover:text-white",
        className
      )}
      {...props}
    />
  );
}

export function PlayerControls() {
  const {
    playlists,
    currentPlaylistId,
    currentTrackIndex,
    playNext,
    playPrevious,
    isShuffleEnabled,
    toggleShuffle,
    repeatMode,
    cycleRepeatMode,
  } = usePlaylistStore();

  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);
  const canPlayPrevious = currentTrackIndex > 0;
  const canPlayNext =
    !!currentPlaylist &&
    (repeatMode === "playlist"
      ? currentPlaylist.tracks.length > 0
      : currentTrackIndex < currentPlaylist.tracks.length - 1);
  const repeatLabel =
    repeatMode === "one"
      ? "Repeat one"
      : repeatMode === "playlist"
      ? "Repeat playlist"
      : "Repeat";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-6">
        <div
          className={cn(
            "motion-preset-opacity-in-0 motion-blur-in-lg motion-delay-100 motion-translate-x-in-[80px] motion-scale-in-75"
          )}
        >
          <button
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full cursor-pointer trans hover:scale-110 active:scale-95",
              "border border-white/10 text-white hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:border-transparent disabled:hover:border-white/10"
            )}
            onClick={playPrevious}
            disabled={!canPlayPrevious}
            title="Previous"
            type="button"
          >
            <SkipBack className="h-5 w-5" />
          </button>
        </div>
        <div
          className={cn(
            "motion-opacity-in-0 motion-scale-in-50 motion-blur-in-lg"
          )}
        >
          {/* <button
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full hover:scale-110 active:scale-95 trans cursor-pointer",
              "bg-white text-black disabled:opacity-40"
            )}
            onClick={togglePlay}
            disabled={isLoadingNewVideo || !apiReady}
            title={isPlaying ? "Pause" : "Play"}
            type="button"
          >
            {!apiReady || isLoadingNewVideo ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying || pendingPlayState !== null ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 translate-x-[1px]" />
            )}
          </button> */}
          <PlayPauseButton />
        </div>
        <div
          className={cn(
            "motion-preset-opacity-in-0 motion-blur-in-lg motion-delay-100 motion-translate-x-in-[-80px] motion-scale-in-75"
          )}
        >
          <button
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full cursor-pointer trans hover:scale-110 active:scale-95",
              "border border-white/10 text-white hover:border-white/40 disabled:opacity-30 disabled:cursor-not-allowed disabled:border-transparent disabled:hover:border-white/10"
            )}
            onClick={playNext}
            disabled={!canPlayNext}
            title="Next"
            type="button"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <TimeDisplay className="motion-preset-blur-up-md motion-delay-500" />
        <ProgressBar className="motion-opacity-in-0 motion-scale-in-0 motion-delay-200" />
      </div>

      <div className="flex items-center justify-between text-sm uppercase text-neutral-600">
        <div className="flex items-center gap-2 sm:min-w-[150px] -translate-x-2 sm:-translate-x-3">
          <PlayerToggleButton
            active={isShuffleEnabled}
            title={isShuffleEnabled ? "Shuffle: On" : "Shuffle: Off"}
            onClick={toggleShuffle}
          >
            <div className="relative">
              <Shuffle className="size-5" />
              <div
                className="size-[3px] absolute rounded-full -bottom-1.5 left-1/2 -translate-x-1/2 bg-white transition-all duration-200"
                style={{
                  opacity: isShuffleEnabled ? 1 : 0,
                }}
              ></div>
            </div>
            <span className="hidden sm:inline-block text-xs sm:text-sm">
              {isShuffleEnabled ? "Shuffling" : "Shuffle"}
            </span>
          </PlayerToggleButton>
        </div>

        <VolumeControl className="motion-preset-blur-up-md motion-delay-500" />

        <div className="flex items-center justify-end gap-2 sm:min-w-[150px] translate-x-2 sm:translate-x-3">
          <PlayerToggleButton
            active={repeatMode !== "off"}
            title={repeatLabel}
            onClick={cycleRepeatMode}
          >
            <div className="relative">
              {repeatMode === "one" ? (
                <Repeat1 className="size-5" />
              ) : (
                <Repeat className="size-5" />
              )}
            </div>
            <span className="hidden sm:inline-block text-xs sm:text-sm">
              {repeatLabel}
            </span>
          </PlayerToggleButton>
        </div>
      </div>
    </div>
  );
}

export const ProgressBar = React.memo(
  ({ className }: { className?: string }) => {
    const seek = usePlayerStore((state) => state.seek);
    const currentTime = usePlayerStore((state) => state.currentTime);
    const duration = usePlayerStore((state) => state.duration);
    const progressPercent = duration ? (currentTime / duration) * 100 : 0;

    return (
      <div className={cn("relative h-1.5 rounded-full bg-white/10", className)}>
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white transition-opacity duration-200"
          style={{ width: `${progressPercent}%` }}
        />
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime || 0}
          onChange={(e) => seek(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 transition-none"
        />
      </div>
    );
  }
);

export const TimeDisplay = React.memo(
  ({ className }: { className?: string }) => {
    const currentTime = usePlayerStore((state) => state.currentTime);
    const duration = usePlayerStore((state) => state.duration);

    return (
      <div
        className={cn(
          "flex items-center justify-between text-xs font-mono text-neutral-500",
          className
        )}
      >
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    );
  }
);

export const VolumeControl = React.memo(
  ({ className }: { className?: string }) => {
    const volume = usePlayerStore((state) => state.volume);
    const handleVolumeChange = usePlayerStore(
      (state) => state.handleVolumeChange
    );

    return (
      <div
        className={cn("flex items-center gap-3 text-neutral-500", className)}
      >
        <Volume2 className="h-4 w-4" />
        <div className="relative h-1.5 w-32 rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/60 transition-none"
            style={{ width: `${volume}%` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={volume || 0}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
        <span className="text-xs font-mono tracking-wider">
          {Math.round(volume ?? 0)}%
        </span>
      </div>
    );
  }
);

export const PlayPauseButton = React.memo(
  ({
    className,
    iconClassName,
    variant = "default",
  }: {
    className?: string;
    iconClassName?: string;
    variant?: "default" | "ghost";
  }) => {
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const togglePlay = usePlayerStore((state) => state.togglePlay);
    const isLoadingNewVideo = usePlayerStore(
      (state) => state.isLoadingNewVideo
    );
    const apiReady = usePlayerStore((state) => state.apiReady);
    const pendingPlayState = usePlayerStore((state) => state.pendingPlayState);

    return (
      <motion.button
        // layoutId="play-pause-button"
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full hover:scale-110 active:scale-95 trans cursor-pointer bg-white",
          variant === "ghost" && "bg-transparent hover:bg-white/10",
          variant === "default" && "bg-white",
          className
        )}
        onClick={togglePlay}
        disabled={isLoadingNewVideo || !apiReady}
      >
        {isPlaying || pendingPlayState !== null ? (
          <Pause
            className={cn(
              "h-6 w-6 text-black trans",
              variant === "ghost" && "text-white",
              iconClassName
            )}
            fill={variant === "ghost" ? "white" : "black"}
          />
        ) : (
          <Play
            className={cn(
              "h-6 w-6 translate-x-[1px] text-black trans",
              variant === "ghost" && "text-white",
              iconClassName
            )}
            fill={variant === "ghost" ? "white" : "black"}
          />
        )}
      </motion.button>
    );
  }
);
