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

// @deprecated
// Using the AnimatedPlayerHeader component instead
export function PlayerControls() {
  const hasMounted = useHasMounted();

  const {
    playlists,
    currentPlaylistId,
    currentTrackIndex,
  } = usePlaylistStore();
  const {
    dispatch,
    isPlaying,
    currentTime,
    duration,
    volume,
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

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="border-0 bg-transparent p-0 motion-preset-slide-up-sm">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-center gap-6">
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-white hover:border-white/40 disabled:opacity-30"
            onClick={() => dispatch({ type: "UserPreviousTrack" })}
            disabled={!canPlayPrevious}
            title="Previous"
            type="button"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-black hover:scale-105 disabled:opacity-40"
            onClick={() => dispatch({ type: "UserTogglePlay" })}
            disabled={
              isLoadingNewVideo || pendingPlayState !== null || !apiReady
            }
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
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-white hover:border-white/40 disabled:opacity-30"
            onClick={() => dispatch({ type: "UserNextTrack" })}
            disabled={!canPlayNext}
            title="Next"
            type="button"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              style={{ width: `${progressPercent}%` }}
            />
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime || 0}
              onChange={(e) =>
                dispatch({ type: "UserSeek", seconds: Number(e.target.value) })
              }
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs uppercase tracking-[0.4em] text-zinc-600">
          <button
            className="flex items-center gap-2 text-zinc-500 hover:text-white"
            type="button"
            title="Shuffle"
          >
            <Shuffle className="h-4 w-4" />
            shuffle
          </button>
          <div className="flex items-center gap-3 text-zinc-500">
            <Volume2 className="h-4 w-4" />
            <div className="relative h-1 w-28 rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white/60"
                style={{ width: `${volume}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={volume || 0}
                onChange={(e) =>
                  dispatch({
                    type: "UserSetVolume",
                    volume: Number(e.target.value),
                  })
                }
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
            <span className="tabular-nums">{Math.round(volume ?? 0)}%</span>
          </div>
          <button
            className="flex items-center gap-2 text-zinc-500 hover:text-white"
            type="button"
            title="Repeat"
          >
            <Repeat className="h-4 w-4" />
            repeat
          </button>
        </div>
      </div>
    </Card>
  );
}
