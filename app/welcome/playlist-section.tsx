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
              <TrackItem
                key={`${track.id}-${track.addedAt}`}
                track={track}
                isCurrentTrack={isCurrentTrack}
                onClick={() => handleTrackClick(index)}
                onRemove={() => handleRemoveTrack(track.id)}
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

interface TrackItemProps {
  track: Track;
  isCurrentTrack: boolean;
  onClick: () => void;
  onRemove: () => void;
}

function PlayingIndicator({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-[3px] h-3 flex-none">
      <div
        className="w-[2px] h-full bg-white rounded-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-300"
        style={{ animationPlayState: isPlaying ? "running" : "paused" }}
      />
      <div
        className="w-[2px] h-full bg-white rounded-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-600"
        style={{ animationPlayState: isPlaying ? "running" : "paused" }}
      />
      <div
        className="w-[2px] h-full bg-white rounded-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-900"
        style={{ animationPlayState: isPlaying ? "running" : "paused" }}
      />
    </div>
  );
}

function TrackItem({
  track,
  isCurrentTrack,
  onClick,
  onRemove,
}: TrackItemProps) {
  const { pendingPlayState, isPlaying } = usePlayerStore();
  const _isPlaying = isPlaying || pendingPlayState !== null;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 cursor-pointer py-1.5"
        // isCurrentTrack ? "bg-white/10" : "hover:bg-white/5"
      )}
      onClick={onClick}
    >
      {/* <div className="relative aspect-video w-12 shrink-0 overflow-hidden rounded-md">
        <Image
          src={track.thumbnailUrl}
          alt={track.title}
          fill
          sizes="36px"
          className="object-cover"
        />
        {isCurrentTrack && <PlayingIndicator isPlaying={_isPlaying} />}
      </div> */}

      <div className="min-w-0 flex-1 flex items-center justify-end gap-2">
        {isCurrentTrack && <PlayingIndicator isPlaying={_isPlaying} />}
        <p
          className={cn(
            "truncate text-sm text-white text-left md:text-right",
            !isCurrentTrack && "text-white/60 hover:text-white"
          )}
        >
          {track.title}
        </p>
        {/* <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span>{formatTime(track.duration)}</span>
          <span>•</span>
          <Link
            href={track.authorUrl ?? ""}
            target="_blank"
            className="text-xs text-neutral-500 hover:underline truncate hover:text-white trans"
          >
            {track.author}
          </Link>
        </div> */}
      </div>

      {/* <div className="flex items-center flex-none gap-2 justify-end overflow-hidden w-0 group-hover:w-12 transition-all duration-100">
        <span className="text-xs text-white/60 hover:text-white">
          {formatTime(track.duration)}
        </span>
      </div> */}

      {/* <div className="flex items-center gap-2 justify-end mx-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-neutral-500 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div> */}
    </div>
  );
}
