"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
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
import { formatTime } from "@/lib/utils/youtube";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { useHasMounted } from "@/hooks/use-has-mounted";

export function PlayerControls() {
  const hasMounted = useHasMounted();
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isHoveringProgress, setIsHoveringProgress] = useState(false);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);

  const {
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

  if (!hasMounted) {
    return null;
  }

  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);
  const canPlayPrevious = currentTrackIndex > 0;
  const canPlayNext =
    !!currentPlaylist && currentTrackIndex < currentPlaylist.tracks.length - 1;

  const handlePlayPrevious = () => {
    playPrevious();
  };

  const handlePlayNext = () => {
    playNext();
  };
  return (
    <Card className="md:flex fixed w-auto md:w-full md:relative bottom-8 left-4 right-4 md:left-0 md:right-0 md:bottom-0">
      <div className="flex flex-1 flex-col gap-4">
        {/* Playback Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          <button
            className="group rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-white/50 transition-all duration-200 hover:border-white/20 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.1)] active:scale-95 cursor-pointer"
            title="Shuffle"
          >
            <Shuffle className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-12" />
          </button>
          <button
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80 transition-all duration-200 hover:border-white/30 hover:text-white hover:shadow-[0_0_16px_rgba(255,255,255,0.12)] disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-none active:scale-90 cursor-pointer"
            onClick={handlePlayPrevious}
            disabled={!canPlayPrevious}
            title="Previous"
          >
            <SkipBack className="h-5 w-5 fill-current transition-transform duration-200 group-hover:-translate-x-0.5" />
          </button>
          <button
            className="group flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/25 focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-50 disabled:hover:scale-100 active:scale-95 cursor-pointer"
            onClick={togglePlay}
            disabled={
              isLoadingNewVideo || pendingPlayState !== null || !apiReady
            }
          >
            {!apiReady || isLoadingNewVideo ? (
              <Loader2 className="h-5 w-5 fill-current animate-spin" />
            ) : isPlaying || pendingPlayState !== null ? (
              <Pause className="h-5 w-5 fill-current transition-all duration-200 group-hover:scale-110" />
            ) : (
              <Play className="h-5 w-5 fill-current translate-x-[1px] transition-all duration-200 group-hover:scale-110" />
            )}
          </button>
          <button
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80 transition-all duration-200 hover:border-white/30 hover:text-white hover:shadow-[0_0_16px_rgba(255,255,255,0.12)] disabled:opacity-30 disabled:hover:scale-100 disabled:hover:shadow-none active:scale-90 cursor-pointer"
            onClick={handlePlayNext}
            disabled={!canPlayNext}
            title="Next"
          >
            <SkipForward className="h-5 w-5 fill-current transition-transform duration-200 group-hover:translate-x-0.5" />
          </button>
          <button
            className="group rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-white/50 transition-all duration-200 hover:border-white/20 hover:text-white hover:shadow-[0_0_12px_rgba(255,255,255,0.1)] active:scale-95 cursor-pointer"
            title="Repeat"
          >
            <Repeat className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="group flex w-full gap-2 flex-row items-center sm:gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 transition-colors duration-200">
            <span className="min-w-[36px] text-right tabular-nums transition-colors duration-200 group-hover:text-zinc-400">
              {formatTime(currentTime)}
            </span>
          </div>
          {/* Custom Range Slider */}
          <div
            className="relative h-1.5 w-full flex-1 cursor-pointer overflow-hidden rounded-full bg-white/10 transition-all duration-200 hover:h-2"
            onMouseEnter={() => setIsHoveringProgress(true)}
            onMouseLeave={() => setIsHoveringProgress(false)}
          >
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-white to-white/60 transition-all duration-300 group-hover:from-white group-hover:to-white/80"
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
            <div
              className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 translate-x-[-6px] rounded-full border border-white/50 bg-[#0a0c10] shadow-[0_0_0_4px_rgba(255,255,255,0.08)] transition-all duration-200 ${
                isHoveringProgress || isDraggingProgress
                  ? "scale-125 shadow-[0_0_0_6px_rgba(255,255,255,0.15)]"
                  : "scale-100"
              }`}
              style={{
                left: `${duration ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime || 0}
              onChange={(e) => seek(Number(e.target.value))}
              onMouseDown={() => setIsDraggingProgress(true)}
              onMouseUp={() => setIsDraggingProgress(false)}
              onTouchStart={() => setIsDraggingProgress(true)}
              onTouchEnd={() => setIsDraggingProgress(false)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>

          {/* Right */}
          <div className="flex items-center justify-end gap-2 text-xs font-mono text-zinc-500 transition-colors duration-200">
            <span className="min-w-[36px] text-right tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control - Integrated inline */}
        <div className="group hidden md:flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/50 transition-colors duration-200 group-hover:text-white/60">
            <Volume2 className="h-4 w-4 text-zinc-400 transition-all duration-200 group-hover:scale-110 group-hover:text-zinc-300" />
            <span className="hidden sm:inline">Volume</span>
          </div>
          <div
            className="relative h-1.5 w-full max-w-[220px] cursor-pointer overflow-hidden rounded-full bg-white/10 transition-all duration-200 hover:h-2 sm:w-28"
            onMouseEnter={() => setIsHoveringVolume(true)}
            onMouseLeave={() => setIsHoveringVolume(false)}
          >
            <div
              className="absolute inset-0 rounded-full bg-white/50 transition-all duration-300 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.3)]"
              style={{ width: `${volume}%` }}
            />
            <div
              className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 translate-x-[-6px] rounded-full border border-white/50 bg-[#0a0c10] shadow-[0_0_0_4px_rgba(255,255,255,0.08)] transition-all duration-200 ${
                isHoveringVolume || isDraggingVolume
                  ? "scale-125 shadow-[0_0_0_6px_rgba(255,255,255,0.15)]"
                  : "scale-100"
              }`}
              style={{ left: `${volume}%` }}
            />
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={volume || 0}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              onMouseDown={() => setIsDraggingVolume(true)}
              onMouseUp={() => setIsDraggingVolume(false)}
              onTouchStart={() => setIsDraggingVolume(true)}
              onTouchEnd={() => setIsDraggingVolume(false)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
