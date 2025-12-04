"use client";

import * as React from "react";
import Image from "next/image";
import type { Track } from "@/lib/types/playlist";
import { Button } from "@/components/ui/button";
import { ClockIcon, Music, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AddTrackDialogContent } from "@/components/playlist/add-track-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { TrackItemSmall } from "@/components/playlist/track-item-small";

export function PlaylistSection() {
  const {
    playlists,
    currentPlaylistId,
    getCurrentActualTrackIndex,
    setCurrentTrackIndex,
    removeTrackFromPlaylist,
    addTrackToPlaylist,
  } = usePlaylistStore();
  const { togglePlay, apiReady } = usePlayerStore();

  const playlist = playlists.find((p) => p.id === currentPlaylistId);
  const currentActualTrackIndex = getCurrentActualTrackIndex();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [dialogKey, setDialogKey] = React.useState(0);

  const handleTrackClick = (index: number) => {
    if (currentActualTrackIndex === index) {
      togglePlay();
    } else {
      setCurrentTrackIndex(index);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    if (currentPlaylistId) {
      removeTrackFromPlaylist(currentPlaylistId, trackId);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setDialogKey((prev) => prev + 1);
    }, 100);
  };

  if (!apiReady) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center md:justify-end gap-3 text-neutral-400">
        <div className="flex flex-row justify-center md:justify-end">
          {/* <p className="text-xs uppercase tracking-[0.3em]">playlist</p> */}
          <h2 className="text-xl font-light text-white">
            {playlist?.name || "Untitled"}
          </h2>
          {/* <p className="text-xs">{playlist?.tracks.length || 0} tracks</p> */}
        </div>
      </div>

      {!playlist || playlist.tracks.length === 0 ? (
        <div className="flex flex-col items-end gap-2 text-sm text-neutral-500">
          <Music className="h-5 w-5" />
          <p>No tracks yet.</p>
          <button
            type="button"
            onClick={() => {
              setIsDialogOpen(true);
              setDialogKey((prev) => prev + 1);
            }}
            disabled={!currentPlaylistId}
            className={cn(
              "text-sm text-white/60 hover:text-white transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            Add from URL
          </button>
        </div>
      ) : (
        <div className="md:max-h-[70vh] overflow-y-auto w-full md:max-w-[400px] flex flex-col items-center md:items-end">
          {playlist.tracks.map((track, index) => {
            const isCurrentTrack = currentActualTrackIndex === index;
            return (
              <TrackItemSmall
                key={`${track.id}-${track.addedAt}`}
                track={track}
                isCurrentTrack={isCurrentTrack}
                onClick={() => handleTrackClick(index)}
                onRemove={() => handleRemoveTrack(track.id)}
                align="right"
              />
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setIsDialogOpen(true);
          setDialogKey((prev) => prev + 1);
        }}
        disabled={!currentPlaylistId}
        className={cn(
          "w-full text-right flex justify-center md:justify-end items-center mt-4 gap-2 text-sm text-white/60 hover:text-white transition-colors cursor-pointer select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed hover:text-white trans hover:underline"
        )}
      >
        <Plus className="h-4 w-4" />
        {/* Add from URL */}
      </button>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          } else {
            setIsDialogOpen(true);
            setDialogKey((prev) => prev + 1);
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl border border-white/10 bg-[#050505] p-0 text-white motion-preset-slide-up-sm">
          <AddTrackDialogContent
            key={dialogKey}
            playlist={playlist || null}
            currentPlaylistId={currentPlaylistId}
            onAddTrack={addTrackToPlaylist}
            onClose={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
