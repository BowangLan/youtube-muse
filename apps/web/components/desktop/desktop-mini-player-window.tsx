"use client";

import * as React from "react";
import Image from "next/image";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { useDesktopRuntime } from "@/components/desktop/desktop-runtime-provider";
import type {
  DesktopPlayerCommand,
  DesktopPlayerSnapshot,
} from "@/lib/desktop/types";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils/youtube";

function TransportButton({
  label,
  icon,
  onClick,
  disabled = false,
  variant = "ghost",
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "primary";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-200 ease-out",
        "disabled:pointer-events-none disabled:opacity-30",
        variant === "primary"
          ? "h-10 w-10 bg-white/95 text-[#0a0a0a] shadow-[0_1px_8px_rgba(255,255,255,0.12)] hover:bg-white hover:shadow-[0_1px_12px_rgba(255,255,255,0.2)] active:scale-95"
          : "h-8 w-8 text-white/60 hover:text-white hover:bg-white/[0.07] active:scale-95",
      )}
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      {icon}
    </button>
  );
}

const EMPTY_STATE: DesktopPlayerSnapshot = {
  track: null,
  isPlaying: false,
  isLoadingNewVideo: false,
  apiReady: false,
  pendingPlayState: null,
  currentTime: 0,
  duration: 0,
  volume: 100,
  canPlayNext: false,
  canPlayPrevious: false,
};

export function DesktopMiniPlayerWindow() {
  const { hasDesktopBridge, closeMiniPlayer } = useDesktopRuntime();
  const [snapshot, setSnapshot] =
    React.useState<DesktopPlayerSnapshot>(EMPTY_STATE);
  const progressBarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!hasDesktopBridge) return;

    void window.youtubeMuseDesktop?.player
      .getState()
      .then((state) => state && setSnapshot(state));

    return window.youtubeMuseDesktop?.player.onState((state) => {
      setSnapshot(state);
    });
  }, [hasDesktopBridge]);

  const sendCommand = React.useCallback((command: DesktopPlayerCommand) => {
    window.youtubeMuseDesktop?.player.sendCommand(command);
  }, []);

  const progressPercent =
    snapshot.duration > 0
      ? Math.min(100, (snapshot.currentTime / snapshot.duration) * 100)
      : 0;

  const handleProgressClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressBarRef.current;
      if (!bar || !snapshot.duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      sendCommand({ type: "seek", seconds: ratio * snapshot.duration });
    },
    [sendCommand, snapshot.duration],
  );

  const isActive = snapshot.isPlaying || snapshot.pendingPlayState !== null;

  return (
    <div className="h-screen w-screen overflow-hidden bg-transparent text-white">
      <div
        className={cn(
          "relative flex h-full w-full flex-col overflow-hidden",
          "border border-white/8 bg-neutral-950",
          "shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_0.5px_0_rgba(255,255,255,0.06)]",
          "transition-shadow duration-700 ease-out",
          isActive && "shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_1px_rgba(255,255,255,0.1),inset_0_0.5px_0_rgba(255,255,255,0.08)]",
        )}
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        {/* Main content row */}
        <div className="flex flex-1 items-center gap-3 px-3">
          {/* Thumbnail */}
          <div className={cn(
            "relative size-[62px] shrink-0 overflow-hidden rounded-[10px]",
            "ring-1 ring-white/6",
            "transition-all duration-500 ease-out",
            isActive && "ring-white/10",
          )}>
            {snapshot.track ? (
              <Image
                src={snapshot.track.thumbnailUrl}
                alt={snapshot.track.title}
                fill
                sizes="62px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/3">
                <div className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/25">
                  Muse
                </div>
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            {snapshot.track ? (
              <>
                <p className="truncate text-[13px] font-medium leading-tight text-white/90 select-none">
                  {snapshot.track.title}
                </p>
                <p className="truncate text-[11px] leading-tight text-white/35 select-none">
                  {snapshot.track.author}
                </p>
              </>
            ) : (
              <p className="text-[13px] font-medium text-white/30 select-none">
                Nothing playing
              </p>
            )}
          </div>

          {/* Transport controls */}
          <div className="flex shrink-0 items-center gap-0.5">
            <TransportButton
              label="Previous track"
              icon={<SkipBack className="h-[14px] w-[14px]" />}
              onClick={() => sendCommand({ type: "previous" })}
              disabled={!snapshot.canPlayPrevious}
            />
            <TransportButton
              label={isActive ? "Pause" : "Play"}
              variant="primary"
              icon={
                snapshot.isLoadingNewVideo ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-[1.5px] border-[#0a0a0a]/25 border-t-[#0a0a0a]" />
                ) : isActive ? (
                  <Pause className="h-[15px] w-[15px]" />
                ) : (
                  <Play className="h-[15px] w-[15px] translate-x-px" />
                )
              }
              onClick={() => sendCommand({ type: "toggle-play" })}
              disabled={!snapshot.apiReady && !snapshot.track}
            />
            <TransportButton
              label="Next track"
              icon={<SkipForward className="h-[14px] w-[14px]" />}
              onClick={() => sendCommand({ type: "next" })}
              disabled={!snapshot.canPlayNext}
            />
          </div>

          {/* Close button */}
          <button
            type="button"
            aria-label="Close mini player"
            onClick={() => void closeMiniPlayer()}
            className="flex h-6 w-6 items-center justify-center rounded-full text-white/25 transition-colors duration-150 hover:bg-white/6 hover:text-white/50"
            style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Progress bar — spans full width at the bottom */}
        <div
          ref={progressBarRef}
          // className="group relative h-[5px] w-full shrink-0 cursor-pointer transition-[height] duration-200 ease-out hover:h-[7px]"
          className="hidden"
          onClick={handleProgressClick}
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <div className="absolute inset-0 bg-white/4" />
          <div
            className={cn(
              "absolute inset-y-0 left-0 transition-[width] duration-100 ease-linear",
              isActive
                ? "bg-white/50 group-hover:bg-white/70"
                : "bg-white/25 group-hover:bg-white/40",
            )}
            style={{ width: `${progressPercent}%` }}
          />
          {/* Time tooltip on hover */}
          {snapshot.duration > 0 && (
            <div className="pointer-events-none absolute -top-5 right-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <span className="text-[10px] tabular-nums text-white/40">
                {formatTime(snapshot.currentTime)}
                <span className="text-white/20"> / </span>
                {formatTime(snapshot.duration)}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
