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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, getThumbnailUrl } from "@/lib/utils/youtube";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { useHasMounted } from "@/hooks/use-has-mounted";
import Link from "next/link";
import { AppHeader } from "../layout/app-header";

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
    !!currentPlaylist && currentTrackIndex < currentPlaylist.tracks.length - 1;
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

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

  if (!hasMounted) {
    return (
      <header className="space-y-8">
        <AppHeader />
      </header>
    );
  }

  return (
    <>
      {/* Sticky mini player bar - shown when main player is hidden */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
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
          <div
            ref={playerRef}
            className="space-y-6 motion-translate-y-in-[20px] motion-blur-in-md motion-opacity-in-0"
          >
            {/* Album art & track info */}
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative aspect-video w-full max-w-xs md:max-w-[22rem] overflow-hidden rounded-xl">
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
                <span className="text-xs uppercase tracking-[0.4em] text-neutral-600">
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

            {/* Player controls */}
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-center gap-6">
                <button
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-white hover:border-white/40 disabled:opacity-30 transition-all"
                  onClick={playPrevious}
                  disabled={!canPlayPrevious}
                  title="Previous"
                  type="button"
                >
                  <SkipBack className="h-5 w-5" />
                </button>
                <button
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black hover:scale-105 disabled:opacity-40 transition-all"
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
                <button
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-white hover:border-white/40 disabled:opacity-30 transition-all"
                  onClick={playNext}
                  disabled={!canPlayNext}
                  title="Next"
                  type="button"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-500">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="relative h-1.5 rounded-full bg-white/10">
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

              <div className="flex items-center justify-between text-xs uppercase text-neutral-600">
                <button
                  className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                  type="button"
                  title="Shuffle"
                >
                  <Shuffle className="size-3" />
                  Shuffle
                </button>
                <div className="flex items-center gap-3 text-neutral-500">
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
                <button
                  className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                  type="button"
                  title="Repeat"
                >
                  <Repeat className="size-3" />
                  Repeat
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
