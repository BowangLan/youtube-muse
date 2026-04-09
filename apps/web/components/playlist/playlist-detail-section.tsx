"use client";

import * as React from "react";
import type { Track } from "@/lib/types/playlist";
import { cn } from "@/lib/utils";
import { TrackItemSmall } from "@/components/playlist/track-item-small";
import { ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
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
  const removeCustomPlaylist = useCustomPlaylistsStore(
    (state) => state.removeCustomPlaylist
  );

  const dispatch = usePlayerStore((state) => state.dispatch);

  const activePlaylist = React.useMemo(() => {
    if (!activePlaylistId) return undefined;
    return playlists.find((p) => p.id === activePlaylistId);
  }, [activePlaylistId, playlists]);

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
    ]
  );

  const handleRemoveTrack = React.useCallback(
    (trackId: string) => {
      if (!activePlaylistId) return;
      removeTrackFromPlaylist(activePlaylistId, trackId);
    },
    [activePlaylistId, removeTrackFromPlaylist]
  );

  const handleAddTrackByUrl = React.useCallback(
    (track: Track) => {
      if (!activePlaylistId) return;
      addTrackToPlaylist(activePlaylistId, track);
    },
    [activePlaylistId, addTrackToPlaylist]
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

  if (!activePlaylist) return null;

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
          "before:from-neutral-900 before:to-neutral-800"
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
            {activePlaylistId && activePlaylist && (
              <AddTrackByUrlDialog
                playlistId={activePlaylistId}
                currentTracks={activePlaylist.tracks}
                onTrackAdd={handleAddTrackByUrl}
              />
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 sm:h-10 sm:w-10"
                >
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
          </div>
        </div>

        <div className="mt-4 mb-2 flex-1 space-y-2 overflow-y-auto px-2 sm:space-y-1 sm:px-3">
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
                  currentPlaylistId === activePlaylistId &&
                  currentActualTrackIndex === index
                }
                onClick={() => handleTrackClick(index)}
                onRemove={() => handleRemoveTrack(track.id)}
                align="left"
              />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
