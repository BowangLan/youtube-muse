"use client";

import * as React from "react";
import type { Track } from "@/lib/types/playlist";
import { cn } from "@/lib/utils";
import { TrackItemSmall } from "@/components/playlist/track-item-small";
import { ArrowLeft, Loader2, MoreVertical, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useV4AppStateStore } from "@/lib/store/v4-app-state-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { motion } from "motion/react";
import { EASING_DURATION_CARD, EASING_EASE_OUT } from "@/lib/styles/animation";
import { AddTrackByUrlDialog } from "@/components/intent/add-track-by-url-dialog";
import { useCustomPlaylistsStore } from "@/lib/store/custom-playlists-store";
import {
  isSpotifyPlaylistId,
  spotifySourcePlaylistId,
  useSpotifyStore,
} from "@/lib/store/spotify-store";
import { toSpotifyTrack } from "@/lib/spotify/convert";
import { toast } from "sonner";

function countTrackOccurrences(tracks: Track[]) {
  const counts = new Map<string, number>();
  tracks.forEach((track) => counts.set(track.id, (counts.get(track.id) ?? 0) + 1));
  return counts;
}

function countPlaylistChanges(previousTracks: Track[], nextTracks: Track[]) {
  const previousCounts = countTrackOccurrences(previousTracks);
  const nextCounts = countTrackOccurrences(nextTracks);
  let addedCount = 0;
  let removedCount = 0;

  nextCounts.forEach((count, id) => {
    addedCount += Math.max(0, count - (previousCounts.get(id) ?? 0));
  });
  previousCounts.forEach((count, id) => {
    removedCount += Math.max(0, count - (nextCounts.get(id) ?? 0));
  });

  const orderChanged =
    previousTracks.length === nextTracks.length &&
    previousTracks.some((track, index) => track.id !== nextTracks[index]?.id);

  return { addedCount, removedCount, orderChanged };
}

export function PlaylistDetailSection() {
  const activePlaylistId = useV4AppStateStore((state) => state.activePlaylistId);
  const closePlaylistDetail = useV4AppStateStore((state) => state.closePlaylistDetail);

  const playlists = usePlaylistStore((state) => state.playlists);
  const currentPlaylistId = usePlaylistStore((state) => state.currentPlaylistId);
  const currentTrackIndex = usePlaylistStore((state) => state.currentTrackIndex);
  const isShuffleEnabled = usePlaylistStore((state) => state.isShuffleEnabled);
  const shuffleOrder = usePlaylistStore((state) => state.shuffleOrder);
  const setCurrentTrackIndex = usePlaylistStore((state) => state.setCurrentTrackIndex);
  const setCurrentPlaylist = usePlaylistStore((state) => state.setCurrentPlaylist);
  const addTrackToPlaylist = usePlaylistStore((state) => state.addTrackToPlaylist);
  const removeTrackFromPlaylist = usePlaylistStore((state) => state.removeTrackFromPlaylist);
  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);
  const setPlaylistTracks = usePlaylistStore((state) => state.setPlaylistTracks);
  const loadSpotifyPlaylistContents = useSpotifyStore((state) => state.loadPlaylistContents);
  const loadingSpotifyPlaylistIds = useSpotifyStore((state) => state.loadingPlaylistIds);
  const spotifyPlaylistErrors = useSpotifyStore((state) => state.playlistErrors);
  const removeCustomPlaylist = useCustomPlaylistsStore((state) => state.removeCustomPlaylist);

  const dispatch = usePlayerStore((state) => state.dispatch);

  const activePlaylist = React.useMemo(() => {
    if (!activePlaylistId) return undefined;
    return playlists.find((p) => p.id === activePlaylistId);
  }, [activePlaylistId, playlists]);
  const spotifyContentId = activePlaylistId ? spotifySourcePlaylistId(activePlaylistId) : null;
  const isLoadingSpotifyContent =
    spotifyContentId !== null && loadingSpotifyPlaylistIds.includes(spotifyContentId);
  const spotifyLoadError =
    spotifyContentId === null ? null : (spotifyPlaylistErrors[spotifyContentId] ?? null);

  React.useEffect(() => {
    if (!activePlaylistId || !spotifyContentId || activePlaylist?.tracks.length) return;
    void loadSpotifyPlaylistContents(spotifyContentId).then((tracks) => {
      if (tracks) setPlaylistTracks(activePlaylistId, tracks.map(toSpotifyTrack));
    });
  }, [
    activePlaylist?.tracks.length,
    activePlaylistId,
    loadSpotifyPlaylistContents,
    setPlaylistTracks,
    spotifyContentId,
  ]);

  const currentActualTrackIndex =
    isShuffleEnabled && shuffleOrder.length > 0
      ? (shuffleOrder[currentTrackIndex] ?? currentTrackIndex)
      : currentTrackIndex;

  const handleTrackClick = React.useCallback(
    (index: number) => {
      if (!activePlaylistId) return;

      if (currentPlaylistId !== activePlaylistId) {
        setCurrentPlaylist(activePlaylistId);
        setCurrentTrackIndex(index);
      } else if (currentActualTrackIndex === index) {
        dispatch({ type: "UserTogglePlay" });
      } else {
        setCurrentTrackIndex(index);
      }
    },
    [
      activePlaylistId,
      currentPlaylistId,
      currentActualTrackIndex,
      dispatch,
      setCurrentPlaylist,
      setCurrentTrackIndex,
    ],
  );

  const handleRemoveTrack = React.useCallback(
    (trackId: string) => {
      if (!activePlaylistId) return;
      removeTrackFromPlaylist(activePlaylistId, trackId);
    },
    [activePlaylistId, removeTrackFromPlaylist],
  );

  const handleAddTrackByUrl = React.useCallback(
    (track: Track) => {
      if (!activePlaylistId) return;
      addTrackToPlaylist(activePlaylistId, track);
    },
    [activePlaylistId, addTrackToPlaylist],
  );

  const handleDelete = React.useCallback(() => {
    if (!activePlaylistId || !activePlaylist) return;

    if (currentPlaylistId === activePlaylistId) {
      setCurrentPlaylist(null);
    }

    deletePlaylist(activePlaylistId);
    removeCustomPlaylist(activePlaylistId);
    closePlaylistDetail();
  }, [
    activePlaylistId,
    activePlaylist,
    closePlaylistDetail,
    currentPlaylistId,
    deletePlaylist,
    removeCustomPlaylist,
    setCurrentPlaylist,
  ]);

  const handleSpotifyRefresh = React.useCallback(async () => {
    if (!activePlaylistId || !activePlaylist || !spotifyContentId) return;

    const spotifyTracks = await loadSpotifyPlaylistContents(spotifyContentId, { force: true });

    if (!spotifyTracks) {
      toast.error("Couldn't sync this Spotify playlist");
      return;
    }

    const nextTracks = spotifyTracks.map(toSpotifyTrack);
    const { addedCount, removedCount, orderChanged } = countPlaylistChanges(
      activePlaylist.tracks,
      nextTracks,
    );

    setPlaylistTracks(activePlaylistId, nextTracks);

    const refreshError = useSpotifyStore.getState().playlistErrors[spotifyContentId];
    if (refreshError) {
      toast.warning("Spotify returned partial updates", {
        description: refreshError,
      });
      return;
    }

    if (addedCount === 0 && removedCount === 0 && !orderChanged) {
      toast.success("Playlist is up to date", {
        description: `${nextTracks.length.toLocaleString()} tracks synced from Spotify`,
      });
      return;
    }

    const changes = [
      addedCount > 0 ? `${addedCount} added` : null,
      removedCount > 0 ? `${removedCount} removed` : null,
      orderChanged ? "order updated" : null,
    ].filter(Boolean);

    toast.success("Spotify updates synced", {
      description: changes.join(", "),
    });
  }, [
    activePlaylist,
    activePlaylistId,
    loadSpotifyPlaylistContents,
    setPlaylistTracks,
    spotifyContentId,
  ]);

  if (!activePlaylist) return null;

  const isReadOnly = isSpotifyPlaylistId(activePlaylist.id);

  return (
    <motion.section
      aria-label={`Playlist - ${activePlaylist.name}`}
      className="space-y-6 md:space-y-8"
      layoutId={`intent-detail-section-${activePlaylist.id}`}
      layout
      transition={{ duration: EASING_DURATION_CARD, ease: EASING_EASE_OUT }}
    >
      <div
        className={cn(
          "relative flex flex-1 flex-col gap-3 overflow-hidden overflow-y-auto rounded-2xl p-3 md:p-3",
          "border border-white/5 bg-white/3",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-linear-to-br before:opacity-90",
          "before:from-neutral-900 before:to-neutral-800",
        )}
      >
        <div className="relative w-full flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              closePlaylistDetail();
            }}
            size="icon"
            className="h-11 w-11 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>

          <div className="pointer-events-none absolute inset-0 flex h-full select-none flex-col items-center justify-center gap-1">
            <motion.div
              className="text-base/tight md:text-lg/tight font-normal text-white"
              layout="position"
              layoutId={`intent-name-${activePlaylist.id}`}
              transition={{
                duration: EASING_DURATION_CARD,
                ease: EASING_EASE_OUT,
              }}
            >
              {activePlaylist.name}
            </motion.div>
            <div className="text-xs/tight md:text-sm/tight font-normal text-white/60 tracking-wide">
              {activePlaylist.tracks.length.toLocaleString()} tracks
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-1">
            {isReadOnly && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={`Sync ${activePlaylist.name} from Spotify`}
                title="Sync updates from Spotify"
                disabled={isLoadingSpotifyContent}
                onClick={() => void handleSpotifyRefresh()}
              >
                <RefreshCw className={cn("size-4", isLoadingSpotifyContent && "animate-spin")} />
              </Button>
            )}

            {!isReadOnly && activePlaylistId && activePlaylist && (
              <AddTrackByUrlDialog
                playlistId={activePlaylistId}
                currentTracks={activePlaylist.tracks}
                onTrackAdd={handleAddTrackByUrl}
              />
            )}

            {!isReadOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-10 sm:w-10">
                    <MoreVertical className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-red-400 focus:text-red-400"
                  >
                    <Trash2 className="text-red-400" />
                    Delete Playlist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="mt-4 mb-2 flex-1 space-y-2 overflow-y-auto px-2 sm:space-y-1 sm:px-3">
          {isLoadingSpotifyContent && activePlaylist.tracks.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading playlist…
            </div>
          )}
          {!isLoadingSpotifyContent && spotifyLoadError && activePlaylist.tracks.length === 0 && (
            <p className="py-12 text-center text-sm text-red-300">{spotifyLoadError}</p>
          )}
          {activePlaylist.tracks.map((track, index) => (
            <div
              key={`${track.id}-${track.addedAt}`}
              className="motion-preset-blur-down"
              style={
                {
                  "--motion-delay": `${index * 50 + 400}ms`,
                } as React.CSSProperties
              }
            >
              <TrackItemSmall
                track={track}
                isCurrentTrack={
                  currentPlaylistId === activePlaylistId && currentActualTrackIndex === index
                }
                onClick={() => handleTrackClick(index)}
                onRemove={isReadOnly ? undefined : () => handleRemoveTrack(track.id)}
                align="left"
                readOnly={isReadOnly}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
