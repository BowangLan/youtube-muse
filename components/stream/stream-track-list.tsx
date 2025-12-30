"use client";

import * as React from "react";
import { Radio } from "lucide-react";
import { TrackItemMedium } from "@/components/playlist/track-item-medium";
import type { Playlist, Track } from "@/lib/types/playlist";

interface StreamTrackListProps {
  playlist: Playlist;
  currentPlaylistId: string | null;
  currentActualTrackIndex: number;
  onTrackClick: (index: number) => void;
  onRemoveTrack: (trackId: string) => void;
}

type GroupedTracks = {
  label: string;
  isToday: boolean;
  daysAgo?: number; // Number of days ago (for recent dates within 14 days)
  dateKey: string; // For sorting
  tracks: Array<{ track: Track; originalIndex: number }>;
};

/**
 * Groups tracks by their published date
 */
function groupTracksByDate(tracks: Track[]): GroupedTracks[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const groups: Map<
    string,
    {
      tracks: Array<{ track: Track; originalIndex: number }>;
      date: Date | null;
    }
  > = new Map();

  tracks.forEach((track, index) => {
    // If no publishedAt, group under "Unknown Date"
    if (!track.publishedAt) {
      const key = "Unknown Date";
      if (!groups.has(key)) groups.set(key, { tracks: [], date: null });
      groups.get(key)!.tracks.push({ track, originalIndex: index });
      return;
    }

    const publishedDate = new Date(track.publishedAt);
    const dateOnly = new Date(
      publishedDate.getFullYear(),
      publishedDate.getMonth(),
      publishedDate.getDate()
    );

    const dateKey = dateOnly.toISOString();

    if (!groups.has(dateKey)) {
      groups.set(dateKey, { tracks: [], date: dateOnly });
    }
    groups.get(dateKey)!.tracks.push({ track, originalIndex: index });
  });

  // Convert to array and sort by date (most recent first)
  const result: GroupedTracks[] = Array.from(groups.entries())
    .filter(([key]) => key !== "Unknown Date")
    .sort(([, a], [, b]) => {
      if (!a.date || !b.date) return 0;
      return b.date.getTime() - a.date.getTime();
    })
    .map(([dateKey, { tracks, date }]) => {
      const isToday = date ? date.getTime() === today.getTime() : false;
      const label = date
        ? date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "";

      // Calculate days ago for dates within 14 days
      let daysAgo: number | undefined;
      if (date) {
        const diffMs = today.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 14) {
          daysAgo = diffDays;
        }
      }

      return {
        label,
        isToday,
        daysAgo,
        dateKey,
        tracks,
      };
    });

  // Add "Unknown Date" group at the end if it exists
  if (groups.has("Unknown Date")) {
    result.push({
      label: "Unknown Date",
      isToday: false,
      daysAgo: undefined,
      dateKey: "unknown",
      tracks: groups.get("Unknown Date")!.tracks,
    });
  }

  return result;
}

export function StreamTrackList({
  playlist,
  currentPlaylistId,
  currentActualTrackIndex,
  onTrackClick,
  onRemoveTrack,
}: StreamTrackListProps) {
  const groupedTracks = React.useMemo(
    () => groupTracksByDate(playlist.tracks),
    [playlist.tracks]
  );

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
          <div className="space-y-6">
            {groupedTracks.map((group) => (
              <div key={group.dateKey} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-sm font-semibold text-white/70">
                    {group.label}
                    {!group.isToday &&
                      group.daysAgo !== undefined &&
                      group.daysAgo > 0 && (
                        <span className="ml-2 text-white/50">
                          {group.daysAgo} {group.daysAgo === 1 ? "day" : "days"}{" "}
                          ago
                        </span>
                      )}
                    {group.isToday && (
                      <span className="ml-2 text-white/50">Today</span>
                    )}
                  </h3>
                </div>
                <div className="space-y-1">
                  {group.tracks.map(({ track, originalIndex }) => (
                    <TrackItemMedium
                      key={track.id}
                      track={track}
                      isCurrentTrack={
                        currentPlaylistId === playlist.id &&
                        currentActualTrackIndex === originalIndex
                      }
                      onClick={() => onTrackClick(originalIndex)}
                      onRemove={() => onRemoveTrack(track.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
