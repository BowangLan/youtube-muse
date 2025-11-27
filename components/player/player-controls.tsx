"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Shuffle,
  Repeat,
} from "lucide-react";
import { formatTime } from "@/lib/utils/youtube";

interface PlayerControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  canPlayPrevious: boolean;
  canPlayNext: boolean;
  onTogglePlay: () => void;
  onPlayPrevious: () => void;
  onPlayNext: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
}

export function PlayerControls({
  isPlaying,
  currentTime,
  duration,
  volume,
  canPlayPrevious,
  canPlayNext,
  onTogglePlay,
  onPlayPrevious,
  onPlayNext,
  onSeek,
  onVolumeChange,
}: PlayerControlsProps) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <button
          className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.25em] text-white/50 transition hover:border-white/20 hover:text-white"
          title="Shuffle"
        >
          <Shuffle className="h-3.5 w-3.5" />
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-30"
          onClick={onPlayPrevious}
          disabled={!canPlayPrevious}
          title="Previous"
        >
          <SkipBack className="h-5 w-5 fill-current" />
        </button>
        <button
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black shadow-lg shadow-white/15 transition hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-white/50"
          onClick={onTogglePlay}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 fill-current" />
          ) : (
            <Play className="h-5 w-5 fill-current translate-x-[1px]" />
          )}
        </button>
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:border-white/30 hover:text-white disabled:opacity-30"
          onClick={onPlayNext}
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
      <div className="group flex w-full items-center gap-3">
        <span className="min-w-[32px] font-mono text-[10px] text-zinc-500">
          {formatTime(currentTime)}
        </span>
        {/* Custom Range Slider */}
        <div className="relative h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/10">
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
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-[10px] text-zinc-500 font-mono min-w-[32px]">
          {formatTime(duration)}
        </span>
      </div>

      {/* Volume Control - Integrated inline */}
      <div className="group flex items-center justify-end gap-2">
        <Volume2 className="h-4 w-4 text-zinc-400" />
        <div className="relative h-1.5 w-24 cursor-pointer overflow-hidden rounded-full bg-white/10">
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
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
