"use client";

/* eslint-disable no-console */
const DEBUG_PLAYER = false;
const debug = (...args: unknown[]) => {
  if (DEBUG_PLAYER) console.log("[LatestVideosSidebar]", ...args);
};

import * as React from "react";
import { useChannelsStore } from "@/lib/store/channels-store";
import {
  useChannelVideoPlaylistStore,
  CHANNEL_VIDEO_PLAYLIST_ID,
} from "@/lib/store/channels-video-playlist-store";
import { cn } from "@/lib/utils";
import { Plus, Radio, Settings2, X } from "lucide-react";
import { usePlayerStore } from "@/lib/store/player-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { ManageChannelsDialog } from "@/components/channels/manage-channels-dialog";
import { TrackCard } from "@/components/playlist/track-card";
import type { Track } from "@/lib/types/playlist";
import { V4TabContentHeader } from "../v4-tab-content-header";
import { TrackItemMedium } from "@/components/playlist/track-item-medium";


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

/** Match track to channel via authorUrl (contains /channel/{channelId}) */
function trackBelongsToChannel(track: Track, channelId: string): boolean {
  return track.authorUrl.includes(`/channel/${channelId}`);
}

export function LatestVideosGrid() {
  const channels = useChannelsStore((state) => state.channels);
  const tracks = useChannelVideoPlaylistStore((state) => state.playlist.tracks);
  const [selectedChannelId, setSelectedChannelId] = React.useState<string | null>(null);
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

  const filteredTracks = React.useMemo(
    () =>
      selectedChannelId
        ? tracks.filter((t) => trackBelongsToChannel(t, selectedChannelId))
        : tracks,
    [tracks, selectedChannelId]
  );

  const groupedTracks = React.useMemo(
    () => groupTracksByDate(filteredTracks),
    [filteredTracks]
  );

  // Debug: log when playlist/player state changes (initial + on track change)
  const playerReady = usePlayerStore((state) => state.playerReady);
  const apiReady = usePlayerStore((state) => state.apiReady);
  const playerMode = usePlayerStore((state) => state.mode);
  const desiredPlayback = usePlayerStore((state) => state.desiredPlayback);
  const currentTrackFromStore = usePlaylistStore((state) => state.getCurrentTrack());

  React.useEffect(() => {
    if (!DEBUG_PLAYER) return;
    debug("state changed", {
      currentPlaylistId,
      currentTrackIndex,
      currentActualTrackIndex,
      currentTrackId: currentTrackFromStore?.id ?? null,
      playerReady,
      apiReady,
      playerMode,
      desiredPlayback,
      channelPlaylistExists: !!channelPlaylist,
      channelPlaylistTrackCount: channelPlaylist?.tracks.length ?? 0,
    });
  }, [
    currentPlaylistId,
    currentTrackIndex,
    currentActualTrackIndex,
    currentTrackFromStore?.id,
    playerReady,
    apiReady,
    playerMode,
    desiredPlayback,
    channelPlaylist,
  ]);

  const handleTrackClick = React.useCallback(
    (index: number) => {
      const playlistState = usePlaylistStore.getState();
      const playerState = usePlayerStore.getState();
      const trackBefore = playlistState.getCurrentTrack();
      const playlistBefore = playlistState.playlists.find(
        (p) => p.id === CHANNEL_VIDEO_PLAYLIST_ID
      );

      debug("handleTrackClick START", {
        index,
        isChannelPlaylistActive,
        currentActualTrackIndex,
        currentPlaylistId,
        currentTrackIndex,
        trackBefore: trackBefore?.id ?? null,
        playlistExists: !!playlistBefore,
        playlistTrackCount: playlistBefore?.tracks.length ?? 0,
        playerReady: playerState.playerReady,
        apiReady: playerState.apiReady,
        mode: playerState.mode,
        desiredPlayback: playerState.desiredPlayback,
      });

      // If viewing a different playlist than the one currently playing, switch to it
      if (!isChannelPlaylistActive) {
        debug("handleTrackClick: switching playlist, then setting index", index);
        setCurrentPlaylist(CHANNEL_VIDEO_PLAYLIST_ID);
        // setCurrentPlaylist resets to index 0, so we need to set the correct index
        setCurrentTrackIndex(index);
        const afterPlaylist = usePlaylistStore.getState();
        debug("handleTrackClick: after setCurrentPlaylist+setIndex", {
          currentTrackIndex: afterPlaylist.currentTrackIndex,
          trackNow: afterPlaylist.getCurrentTrack()?.id ?? null,
        });
      } else if (currentActualTrackIndex === index) {
        // Clicking current track toggles play/pause
        debug("handleTrackClick: toggling play/pause");
        dispatch({ type: "UserTogglePlay" });
      } else {
        // Switch to new track
        debug("handleTrackClick: switching to track index", index);
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
      <aside className={cn("space-y-4")}>
        <div className="sticky top-0 z-10 pb-2 backdrop-blur">
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

  const displayChannels = selectedChannelId ? [channels.find((c) => c.id === selectedChannelId)!] : channels;

  return (
    <div className={cn("mx-auto max-w-3xl")}>
      <V4TabContentHeader title="Latest Videos" />
      {/* Header - horizontal list of channels */}
      <div className="flex-none">
        <div className="flex items-start gap-6 flex-1 min-w-0 overflow-x-auto py-3 mb-6">
          {displayChannels.map((channel) => {
            const isSelected = selectedChannelId === channel.id;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() =>
                  setSelectedChannelId((prev) =>
                    prev === channel.id ? null : channel.id
                  )
                }
                className={cn(
                  "flex flex-col items-center relative gap-2 w-16 shrink-0 group cursor-pointer select-none rounded-lg p-1 -m-1 transition-colors",
                  isSelected && "rounded-full"
                )}
              >
                <div className="relative">
                  <img
                    src={channel.thumbnailUrl}
                    alt={channel.title}
                    className={cn(
                      "size-13 rounded-full object-cover trans"
                    )}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <X className="size-4 text-white" />
                    </div>
                  )}
                </div>
                <span className="text-xs text-center truncate w-full max-w-12 font-medium text-foreground/60 group-hover:text-foreground trans">
                  {channel.title}
                </span>

                {/* an overlay that shows up when a channel is selected and hovered, with a X icon */}
              </button>
            );
          })}
          <div className="flex flex-col items-center gap-2 w-12 shrink-0">
            <ManageChannelsDialog
              trigger={
                <button
                  type="button"
                  className="flex shrink-0 items-center justify-center size-12 rounded-full border border-white/10 bg-white/5 p-2.5 text-foreground/60 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-foreground cursor-pointer select-none"
                  aria-label="Manage channels"
                >
                  <Settings2 className="size-4" />
                </button>
              }
            />
            <span className="text-xs text-center truncate w-full max-w-12 font-medium invisible" aria-hidden>MC</span>
          </div>
        </div>
      </div>


      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-6 py-16 text-center text-white/45">
          <Radio className="h-12 w-12" />
          <p className="text-sm">No videos found from your channels.</p>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-6 py-16 text-center text-white/45">
          <Radio className="h-12 w-12" />
          <p className="text-sm">No videos from this channel.</p>
        </div>
      ) : (
        <>
          {/* <div
            className="grid gap-3 md:gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            }}
          >
            {filteredTracks.map((track) => {
              const fullIndex = tracks.findIndex((t) => t.id === track.id);
              return (
                <TrackCard
                  key={track.id}
                  track={track}
                  isCurrentTrack={
                    isChannelPlaylistActive && currentActualTrackIndex === fullIndex
                  }
                  onClick={() => handleTrackClick(fullIndex)}
                  onRemove={() => removeTrack(track.id)}
                />
              );
            })}
          </div> */}

          <div className="flex-1 min-h-0 space-y-5 overflow-y-auto sm:space-y-6">
            {groupedTracks.map((group) => (
              <div key={group.dateKey} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground/80">
                    {group.label}
                    {!group.isToday &&
                      group.daysAgo !== undefined &&
                      group.daysAgo > 0 && (
                        <span className="ml-3 text-muted-foreground">
                          {group.daysAgo} {group.daysAgo === 1 ? "day" : "days"} ago
                        </span>
                      )}
                    {group.isToday && (
                      <span className="ml-3 text-muted-foreground">Today</span>
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
                    // card={false}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="h-(--bottom-spacing) flex-none"></div>
          </div>
        </>
      )}
    </div>
  );
}
