"use client";

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
    <Card>
      <div className="flex flex-1 flex-col gap-4">
        {/* Playback Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
          <button
            className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-white/50 transition hover:border-white/20 hover:text-white"
            title="Shuffle"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-30"
            onClick={handlePlayPrevious}
            disabled={!canPlayPrevious}
            title="Previous"
          >
            <SkipBack className="h-5 w-5 fill-current" />
          </button>
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/15 transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white/50"
            onClick={togglePlay}
            disabled={isLoadingNewVideo || !apiReady}
          >
            {!apiReady || isLoadingNewVideo ? (
              <Loader2 className="h-5 w-5 fill-current animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current translate-x-[1px]" />
            )}
          </button>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-30"
            onClick={handlePlayNext}
            disabled={!canPlayNext}
            title="Next"
          >
            <SkipForward className="h-5 w-5 fill-current" />
          </button>
          <button
            className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-white/50 transition hover:border-white/20 hover:text-white"
            title="Repeat"
          >
            <Repeat className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="group flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span className="min-w-[36px] text-right">{formatTime(currentTime)}</span>
            <span className="text-white/20">/</span>
            <span className="min-w-[36px] text-right">{formatTime(duration)}</span>
          </div>
          {/* Custom Range Slider */}
          <div className="relative h-1.5 w-full flex-1 cursor-pointer overflow-hidden rounded-full bg-white/10">
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-r from-white to-white/60 transition-all group-hover:from-white group-hover:to-white/80"
              style={{
                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
              }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 translate-x-[-6px] rounded-full border border-white/50 bg-[#0a0c10] shadow-[0_0_0_4px_rgba(255,255,255,0.08)]"
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
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        </div>

        {/* Volume Control - Integrated inline */}
        <div className="group flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/50">
            <Volume2 className="h-4 w-4 text-zinc-400" />
            <span className="hidden sm:inline">Volume</span>
          </div>
          <div className="relative h-1.5 w-full max-w-[220px] cursor-pointer overflow-hidden rounded-full bg-white/10 sm:w-28">
            <div
              className="absolute inset-0 rounded-full bg-white/50 trans group-hover:bg-white"
              style={{ width: `${volume}%` }}
            />
            <div
              className="absolute top-1/2 h-3 w-3 -translate-y-1/2 translate-x-[-6px] rounded-full border border-white/50 bg-[#0a0c10] shadow-[0_0_0_4px_rgba(255,255,255,0.08)]"
              style={{ left: `${volume}%` }}
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
        </div>
      </div>
    </Card>
  );
}
