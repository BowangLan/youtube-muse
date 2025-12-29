"use client";

import * as React from "react";
import { Radio } from "lucide-react";
import { TrackItemMedium } from "@/components/playlist/track-item-medium";
import type { Playlist } from "@/lib/types/playlist";

interface StreamTrackListProps {
  playlist: Playlist;
  currentPlaylistId: string | null;
  currentActualTrackIndex: number;
  onTrackClick: (index: number) => void;
  onRemoveTrack: (trackId: string) => void;
}

export function StreamTrackList({
  playlist,
  currentPlaylistId,
  currentActualTrackIndex,
  onTrackClick,
  onRemoveTrack,
}: StreamTrackListProps) {
  return (
    <div className="flex-1 px-4 pb-10 sm:px-6 md:px-8 mt-4 md:mt-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-white">Queue</p>
            <p className="text-xs text-white/55">
              {playlist.tracks.length} tracks ready to play
            </p>
          </div>
          <p className="text-xs text-white/50">
            Tip: click the current track to pause.
          </p>
        </div>
        {playlist.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-6 py-16 text-center text-white/45">
            <Radio className="h-12 w-12" />
            <p className="text-sm">
              No tracks yet. Try refreshing to fetch the latest videos.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {playlist.tracks.map((track, index) => (
              <TrackItemMedium
                key={track.id}
                track={track}
                isCurrentTrack={
                  currentPlaylistId === playlist.id &&
                  currentActualTrackIndex === index
                }
                onClick={() => onTrackClick(index)}
                onRemove={() => onRemoveTrack(track.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
