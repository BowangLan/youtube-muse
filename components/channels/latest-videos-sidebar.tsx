"use client";

import * as React from "react";
import { useChannelsStore } from "@/lib/store/channels-store";
import {
  useChannelVideoPlaylistStore,
  CHANNEL_VIDEO_PLAYLIST_ID,
} from "@/lib/store/channels-video-playlist-store";
import { cn } from "@/lib/utils";
import { Plus, Radio } from "lucide-react";
import { usePlayerStore } from "@/lib/store/player-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { ManageChannelsDialog } from "./manage-channels-dialog";
import { TrackItemMedium } from "@/components/playlist/track-item-medium";
import type { Track } from "@/lib/types/playlist";

interface LatestVideosSidebarProps {
  className?: string;
}

type GroupedTracks = {
  label: string;
  isToday: boolean;
  daysAgo?: number;
  dateKey: string;
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

export function LatestVideosSidebar({ className }: LatestVideosSidebarProps) {
  const channels = useChannelsStore((state) => state.channels);
  const tracks = useChannelVideoPlaylistStore((state) => state.playlist.tracks);
  const removeTrack = useChannelVideoPlaylistStore((state) => state.removeTrack);
  const dispatch = usePlayerStore((state) => state.dispatch);

  // Main playlist store for playback coordination
  const playlists = usePlaylistStore((state) => state.playlists);
  const currentPlaylistId = usePlaylistStore((state) => state.currentPlaylistId);
  const currentTrackIndex = usePlaylistStore((state) => state.currentTrackIndex);
  const isShuffleEnabled = usePlaylistStore((state) => state.isShuffleEnabled);
  const shuffleOrder = usePlaylistStore((state) => state.shuffleOrder);
  const setCurrentPlaylist = usePlaylistStore((state) => state.setCurrentPlaylist);
  const setCurrentTrackIndex = usePlaylistStore((state) => state.setCurrentTrackIndex);
  const ensurePlaylist = usePlaylistStore((state) => state.ensurePlaylist);
  const setPlaylistTracks = usePlaylistStore((state) => state.setPlaylistTracks);

  // Check if the channel video playlist exists in main store
  const channelPlaylist = React.useMemo(
    () => playlists.find((p) => p.id === CHANNEL_VIDEO_PLAYLIST_ID),
    [playlists]
  );

  // Sync channel video tracks to main playlist store
  React.useEffect(() => {
    // Ensure the playlist exists with the correct ID
    ensurePlaylist(
      CHANNEL_VIDEO_PLAYLIST_ID,
      "Latest Videos",
      "Latest videos from your subscribed channels",
      tracks
    );

    // Sync tracks if they've changed
    if (channelPlaylist && tracks.length > 0) {
      const existingIds = new Set(channelPlaylist.tracks.map((t) => t.id));
      const newIds = new Set(tracks.map((t) => t.id));
      const hasChanged =
        existingIds.size !== newIds.size ||
        tracks.some((t) => !existingIds.has(t.id));

      if (hasChanged) {
        setPlaylistTracks(CHANNEL_VIDEO_PLAYLIST_ID, tracks);
      }
    }
  }, [tracks, channelPlaylist, ensurePlaylist, setPlaylistTracks]);

  // Calculate actual track index considering shuffle
  const currentActualTrackIndex =
    isShuffleEnabled && shuffleOrder.length > 0
      ? (shuffleOrder[currentTrackIndex] ?? currentTrackIndex)
      : currentTrackIndex;

  // Check if this playlist is currently active
  const isChannelPlaylistActive = currentPlaylistId === CHANNEL_VIDEO_PLAYLIST_ID;

  const groupedTracks = React.useMemo(
    () => groupTracksByDate(tracks),
    [tracks]
  );

  const handleTrackClick = React.useCallback(
    (index: number) => {
      // If viewing a different playlist than the one currently playing, switch to it
      if (!isChannelPlaylistActive) {
        setCurrentPlaylist(CHANNEL_VIDEO_PLAYLIST_ID);
        // setCurrentPlaylist resets to index 0, so we need to set the correct index
        setCurrentTrackIndex(index);
      } else if (currentActualTrackIndex === index) {
        // Clicking current track toggles play/pause
        dispatch({ type: "UserTogglePlay" });
      } else {
        // Switch to new track
        setCurrentTrackIndex(index);
      }
    },
    [
      isChannelPlaylistActive,
      currentActualTrackIndex,
      dispatch,
      setCurrentPlaylist,
      setCurrentTrackIndex,
    ]
  );

  if (channels.length === 0) {
    return (
      <aside className={cn("space-y-4", className)}>
        <div className="sticky top-0 z-10 bg-[#050505]/80 pb-2 backdrop-blur">
          <h2 className="h2">Latest Videos</h2>
        </div>
        <ManageChannelsDialog
          trigger={
            <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-sm text-white/40 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-white/60">
              <Plus className="h-4 w-4" />
              Add channels to see latest videos
            </button>
          }
        />
      </aside>
    );
  }

  return (
    <aside className={cn("space-y-4 sm:space-y-5", className)}>
      <div className="flex-none">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="h2">Latest Videos</h2>
            <ManageChannelsDialog
              trigger={
                <button
                  type="button"
                  className="flex items-center cursor-pointer select-none p-2 -m-2 group/manage-trigger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/60 sm:m-0 sm:p-0"
                  aria-label="Manage channels"
                >
                  <div className="flex -space-x-3 group-hover/manage-trigger:-space-x-1">
                    {channels.map((channel) => (
                      <img
                        key={channel.id}
                        src={channel.thumbnailUrl}
                        alt={channel.title}
                        title={channel.title}
                        loading="lazy"
                        className="size-6 flex-none rounded-full object-cover ring-2 ring-[#050505] trans"
                      />
                    ))}
                  </div>
                </button>
              }
            />
          </div>
        </div>
      </div>

      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-6 py-16 text-center text-white/45">
          <Radio className="h-12 w-12" />
          <p className="text-sm">No videos found from your channels.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 space-y-5 overflow-y-auto sm:space-y-6">
          {groupedTracks.map((group) => (
            <div key={group.dateKey} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <h3 className="text-sm font-medium text-white/80">
                  {group.label}
                  {!group.isToday &&
                    group.daysAgo !== undefined &&
                    group.daysAgo > 0 && (
                      <span className="ml-3 text-white/50">
                        {group.daysAgo} {group.daysAgo === 1 ? "day" : "days"} ago
                      </span>
                    )}
                  {group.isToday && (
                    <span className="ml-3 text-white/50">Today</span>
                  )}
                </h3>
              </div>
              <div className="space-y-1">
                {group.tracks.map(({ track, originalIndex }) => (
                  <TrackItemMedium
                    key={track.id}
                    track={track}
                    isCurrentTrack={
                      isChannelPlaylistActive &&
                      currentActualTrackIndex === originalIndex
                    }
                    onClick={() => handleTrackClick(originalIndex)}
                    onRemove={() => removeTrack(track.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          <div className="h-(--bottom-spacing) flex-none"></div>
        </div>
      )}
    </aside>
  );
}
