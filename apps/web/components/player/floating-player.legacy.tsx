"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  PlusCircle,
  Mic2,
  ListMusic,
  Volume2,
  ChevronsUp,
} from "lucide-react";
import Image from "next/image";

interface FloatingPlayerProps {
  currentTrack: {
    title: string;
    artist: string;
    coverUrl: string;
  };
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlayPause: () => void;
  onSkipBack: () => void;
  onSkipForward: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function FloatingPlayer({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onSkipBack,
  onSkipForward,
  onSeek,
  onVolumeChange,
}: FloatingPlayerProps) {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="absolute bottom-6 left-6 right-6 z-30">
      <div className="glass-panel border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-6 max-w-5xl mx-auto">
        {/* Current Track */}
        <div className="flex items-center gap-4 min-w-[160px]">
          <div className="w-10 h-10 rounded bg-zinc-800 border border-white/10 relative overflow-hidden group">
            <Image
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              fill
              sizes="40px"
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
              <ChevronsUp className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xs font-medium text-white tracking-tight">
              {currentTrack.title}
            </span>
            <span className="text-[10px] text-zinc-500">
              {currentTrack.artist}
            </span>
          </div>
          <button className="ml-2 text-zinc-500 hover:text-white trans">
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Controls & Progress */}
        <div className="flex-1 max-w-lg flex flex-col gap-2">
          <div className="flex items-center justify-center gap-6">
            <button className="text-zinc-500 hover:text-white trans">
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onSkipBack}
              className="text-zinc-300 hover:text-white trans"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>
            <button
              onClick={onPlayPause}
              className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </button>
            <button
              onClick={onSkipForward}
              className="text-zinc-300 hover:text-white trans"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>
            <button className="text-zinc-500 hover:text-white trans">
              <Repeat className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3 w-full group">
            <span className="text-[10px] text-zinc-500 font-mono">
              {formatTime(currentTime)}
            </span>
            {/* Custom Range Slider */}
            <div
              className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                onSeek(percentage * duration);
              }}
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-full group-hover:brightness-125 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume / Extra */}
        <div className="flex items-center gap-3 min-w-[160px] justify-end">
          <button className="text-zinc-500 hover:text-white trans">
            <Mic2 className="w-4 h-4" />
          </button>
          <button className="text-zinc-500 hover:text-white trans">
            <ListMusic className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 group">
            <Volume2 className="w-4 h-4 text-zinc-400" />
            <div
              className="w-20 h-1 bg-white/10 rounded-full overflow-hidden relative cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                onVolumeChange(percentage * 100);
              }}
            >
              <div
                className="absolute inset-0 bg-zinc-400 rounded-full group-hover:bg-white transition-colors"
                style={{ width: `${volume}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
