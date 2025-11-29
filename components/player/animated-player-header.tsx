"use client";

import * as React from "react";
import Image from "next/image";
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
import { formatTime, getThumbnailUrl } from "@/lib/utils/youtube";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { useHasMounted } from "@/hooks/use-has-mounted";
import Link from "next/link";
import { AppHeader } from "../layout/app-header";
import { Track } from "@/lib/types/playlist";

const LOADING_PHRASE_LIST = [
  "Let's grind",
  "Let's lock in",
  "Time to lock in",
  "Time to crush it, you got this",
  "Get comfortable, let's focus",
];

const InitialLoadingUI = () => {
  const isMounted = useHasMounted();
  const [loadingPhrase, setLoadingPhrase] = React.useState("");
  const [showMotion, setShowMotion] = React.useState(false);

  React.useEffect(() => {
    if (!isMounted) return;
    setLoadingPhrase(
      LOADING_PHRASE_LIST[
        Math.floor(Math.random() * LOADING_PHRASE_LIST.length)
      ]
    );
    const timer = setTimeout(() => setShowMotion(true), 1100);
    return () => clearTimeout(timer);
  }, [isMounted]);

  return (
    <div
      className={cn(
        "flex flex-col gap-8 items-center pt-[30vh] motion-opacity-in-0 motion-blur-in-lg",
        showMotion && "motion-opacity-out-0 motion-blur-out-md"
      )}
    >
      <p className="text-xl sm:text-3xl md:text-5xl font-light lowercase tracking-wider">
        {loadingPhrase}
      </p>
    </div>
  );
};

export function AnimatedPlayerHeader() {
  const hasMounted = useHasMounted();
  const playerRef = React.useRef<HTMLDivElement>(null);
  const [isPlayerHidden, setIsPlayerHidden] = React.useState(false);

  const {
    getCurrentTrack,
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
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seek,
    handleVolumeChange,
    isLoadingNewVideo,
    apiReady,
    pendingPlayState,
  } = usePlayerStore();

  const track = hasMounted ? getCurrentTrack() : null;
  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);
  const canPlayPrevious = currentTrackIndex > 0;
  const canPlayNext =
    !!currentPlaylist &&
    (repeatMode === "playlist"
      ? currentPlaylist.tracks.length > 0
      : currentTrackIndex < currentPlaylist.tracks.length - 1);
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const repeatLabel =
    repeatMode === "one"
      ? "Repeat one"
      : repeatMode === "playlist"
      ? "Repeat playlist"
      : "Repeat";

  // Intersection Observer to detect when player is hidden
  React.useEffect(() => {
    if (!hasMounted) return;
    if (!track) {
      setIsPlayerHidden(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPlayerHidden(!entry.isIntersecting);
      },
      {
        threshold: 0.85,
        rootMargin: "-0px 0px 0px 0px", // Trigger when player is 60px from top
      }
    );

    const currentRef = playerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [hasMounted, track?.id]); // Use track.id to detect changes

  if (!apiReady) {
    return <InitialLoadingUI />;
  }

  return (
    <>
      {/* Sticky mini player bar - shown when main player is hidden */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-40 trans",
          isPlayerHidden
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="mx-auto w-full max-w-4xl px-4 py-3 sm:px-6">
          {track && (
            <div className="flex items-center gap-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white backdrop-blur-xl bg-[#050505]/25">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative h-10 w-10 overflow-hidden rounded-md aspect-video flex-shrink-0">
                  <Image
                    src={track.thumbnailUrl}
                    alt={track.title}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <Link
                    href={`https://www.youtube.com/watch?v=${track.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    <p className="truncate text-sm">{track.title}</p>
                  </Link>
                  <Link
                    href={track.authorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    <p className="truncate text-xs uppercase text-neutral-500">
                      {track.author || "Unknown Artist"}
                    </p>
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={
                    isLoadingNewVideo || pendingPlayState !== null || !apiReady
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white disabled:opacity-40 hover:bg-white/10 transition-colors"
                >
                  {!apiReady || isLoadingNewVideo ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : isPlaying || pendingPlayState !== null ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4 translate-x-[1px]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={playNext}
                  disabled={!canPlayNext}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* App header and main player section */}
      <header className="space-y-8">
        {/* App branding */}
        <AppHeader />

        {!track ? (
          <div className="flex flex-col gap-4 text-left text-neutral-500">
            <span className="text-xs uppercase tracking-[0.4em]">
              queue empty
            </span>
            <p className="text-2xl text-white">Drop a link to begin.</p>
          </div>
        ) : (
          <div ref={playerRef} className="space-y-6">
            {/* Album art & track info */}
            <CurrentTrackHeader track={track} />

            {/* Player controls */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-center gap-6">
                <div
                  className={cn(
                    "motion-preset-opacity-in-0 motion-blur-in-lg motion-delay-500 motion-translate-x-in-[80px] motion-scale-in-75"
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
                  <button
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
                  </button>
                </div>
                <div
                  className={cn(
                    "motion-preset-opacity-in-0 motion-blur-in-lg motion-delay-500 motion-translate-x-in-[-80px] motion-scale-in-75"
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
                <div className="flex items-center justify-between text-xs font-mono text-neutral-500 motion-preset-blur-up-md motion-delay-1200">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <div className="relative h-1.5 rounded-full bg-white/10 motion-opacity-in-0 motion-scale-in-0 motion-delay-500">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-white transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.1"
                    value={currentTime || 0}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm uppercase text-neutral-600">
                <div className="flex items-center gap-2 min-w-[150px] -translate-x-3">
                  <PlayerToggleButton
                    active={isShuffleEnabled}
                    title={isShuffleEnabled ? "Shuffle: On" : "Shuffle: Off"}
                    onClick={toggleShuffle}
                  >
                    <div className="relative">
                      <Shuffle className="size-4" />
                      <div
                        className="size-[3px] absolute rounded-full -bottom-1.5 left-1/2 -translate-x-1/2 bg-white transition-all duration-200"
                        style={{
                          opacity: isShuffleEnabled ? 1 : 0,
                        }}
                      ></div>
                    </div>
                    {/* {isShuffleEnabled ? "Shuffle: On" : "Shuffle: Off"} */}
                    {isShuffleEnabled ? "Shuffling" : "Shuffle"}
                  </PlayerToggleButton>
                </div>
                <div className="flex items-center gap-3 text-neutral-500 motion-preset-blur-up-md motion-delay-1200">
                  <Volume2 className="h-4 w-4" />
                  <div className="relative h-1 w-28 rounded-full bg-white/10">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-white/60 transition-all"
                      style={{ width: `${volume}%` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={volume || 0}
                      onChange={(e) =>
                        handleVolumeChange(Number(e.target.value))
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>
                  <span className="text-xs font-mono tracking-wider">
                    {Math.round(volume ?? 0)}%
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2 min-w-[150px] translate-x-3">
                  <PlayerToggleButton
                    active={repeatMode !== "off"}
                    title={repeatLabel}
                    onClick={cycleRepeatMode}
                  >
                    <div className="relative">
                      {repeatMode === "one" ? (
                        <Repeat1 className="size-4" />
                      ) : (
                        <Repeat className="size-4" />
                      )}
                      {/* <div
                        className="size-[3px] absolute rounded-full -bottom-1.5 left-1/2 -translate-x-1/2 bg-white transition-all duration-200"
                        style={{
                          opacity: repeatMode === "off" ? 0 : 1,
                        }}
                      ></div> */}
                    </div>
                    {repeatLabel}
                  </PlayerToggleButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

function CurrentTrackHeader({ track }: { track: Track }) {
  return (
    <div className="flex flex-col gap-6 items-center sm:items-start sm:flex-row motion-blur-in-lg motion-opacity-in-0 motion-delay-1200">
      <div className="relative aspect-video w-full max-w-[24rem] sm:max-w-[16rem] md:max-w-[22rem] overflow-hidden rounded-xl">
        <Image
          src={getThumbnailUrl(track.id, "maxresdefault")}
          alt={track.title}
          fill
          sizes="220px"
          className="object-cover"
          priority
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 md:gap-3 text-neutral-300">
        <span className="text-xs uppercase tracking-[0.4em] text-neutral-500">
          playing now
        </span>
        <h2 className="md:text-3xl text-xl font-light leading-tight text-white">
          <a
            href={`https://www.youtube.com/watch?v=${track.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {track.title}
          </a>
        </h2>
        <p className="md:text-sm text-xs">
          <a
            href={track.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            {track.author || "Unknown Artist"}
          </a>
        </p>
      </div>
    </div>
  );
}

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
        "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 relative trans cursor-pointer motion-preset-blur-up-md motion-delay-1200 hover:scale-105 active:scale-95 select-none",
        active ? "text-white" : "text-neutral-500 hover:text-white",
        className
      )}
      {...props}
    />
  );
}
