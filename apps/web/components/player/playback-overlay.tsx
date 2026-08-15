"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Minimize2 } from "lucide-react";
import { Icons } from "../icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useIsPlaying } from "@/hooks/use-is-playing";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePlayerStore } from "@/lib/store/player-store";
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";
import { formatTime } from "@/lib/utils/youtube";
import { cn } from "@/lib/utils";
import { NextButton, PreviousButton, ProgressBar, VolumeControl } from "./player-controls";
import { SliceRepeatToggleButton } from "./slice-repeat-controls";

const controlButtonClassName =
  "inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-transparent text-white/85 transition-[background-color,color,transform] duration-150 hover:bg-white/10 hover:text-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-35";

function ControlTooltip({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip delayDuration={250}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={10} className="z-[99]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function FullscreenPlayPauseButton() {
  const isPlaying = useIsPlaying();
  const dispatch = usePlayerStore((state) => state.dispatch);

  return (
    <ControlTooltip label={isPlaying ? "Pause (Space)" : "Play (Space)"}>
      <button
        type="button"
        aria-label={isPlaying ? "Pause" : "Play"}
        className={cn(controlButtonClassName, "text-white")}
        onClick={() => dispatch({ type: "UserTogglePlay" })}
      >
        {isPlaying ? (
          <Icons.Pause className="size-6" fill="currentColor" />
        ) : (
          <Icons.Play className="size-6 translate-x-px" fill="currentColor" />
        )}
      </button>
    </ControlTooltip>
  );
}

function FullscreenMinimizeButton() {
  const setVideoMode = useYouTubePlayerInstanceStore((state) => state.setVideoMode);

  return (
    <ControlTooltip label="Exit fullscreen (Esc)">
      <button
        type="button"
        aria-label="Exit fullscreen"
        className={controlButtonClassName}
        onClick={() => setVideoMode("floating")}
      >
        <Minimize2 className="size-[18px]" aria-hidden="true" />
      </button>
    </ControlTooltip>
  );
}

function FullscreenControls() {
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-2 sm:px-4 sm:pb-3">
      <ProgressBar showControlButtons className="mb-1" />

      <div className="flex items-center gap-0.5 sm:gap-1">
        <FullscreenPlayPauseButton />
        <PreviousButton
          className="size-10 rounded-md border-0 bg-transparent text-white/70 hover:scale-100 hover:border-0 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white"
          iconClassName="size-[18px]"
        />
        <NextButton
          className="size-10 rounded-md border-0 bg-transparent text-white/70 hover:scale-100 hover:border-0 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white"
          iconClassName="size-[18px]"
        />

        <div
          className="ml-1 hidden whitespace-nowrap font-mono text-[11px] tabular-nums text-white/55 sm:block"
          aria-label={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        >
          <span className="text-white/90">{formatTime(currentTime)}</span>
          <span aria-hidden="true"> / {formatTime(duration)}</span>
        </div>

        <VolumeControl
          className="ml-1 hidden lg:flex"
          innerClassName="h-10 rounded-md bg-transparent px-2 text-white/70 hover:bg-white/10 focus-within:ring-2 focus-within:ring-white"
        />

        <div className="flex-1" />

        <SliceRepeatToggleButton
          compact
          className="size-10 rounded-md bg-transparent p-0 text-white/65 hover:scale-100 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white"
        />
        <FullscreenMinimizeButton />
      </div>
    </div>
  );
}

interface VideoPlaybackOverlayProps {
  videoMode: "hidden" | "floating" | "fullscreen";
}

export function VideoPlaybackOverlay({ videoMode }: VideoPlaybackOverlayProps) {
  const isMobile = useIsMobile();
  const isPlaying = useIsPlaying();
  const dispatch = usePlayerStore((state) => state.dispatch);
  const [showPlaybackFeedback, setShowPlaybackFeedback] = useState(false);

  if (isMobile) return null;

  const togglePlayback = () => {
    dispatch({ type: "UserTogglePlay" });
    setShowPlaybackFeedback(true);
    window.setTimeout(() => setShowPlaybackFeedback(false), 450);
  };

  return (
    <div className="absolute inset-0 z-20 overflow-hidden rounded-[inherit]">
      <button
        type="button"
        aria-label={isPlaying ? "Pause video" : "Play video"}
        className="absolute inset-0 z-0 cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
        onClick={togglePlayback}
      />

      {videoMode === "fullscreen" && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-linear-to-t from-black via-black/75 to-transparent"
          />

          <AnimatePresence>
            {showPlaybackFeedback && (
              <motion.div
                key={isPlaying ? "playing" : "paused"}
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]"
                initial={{ scale: 0.82, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.12, opacity: 0 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                {isPlaying ? (
                  <Icons.Play className="size-10 translate-x-px" fill="currentColor" />
                ) : (
                  <Icons.Pause className="size-10" fill="currentColor" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <FullscreenControls />
        </>
      )}
    </div>
  );
}
