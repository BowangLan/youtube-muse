"use client";

import Image from "next/image";
import type { Playlist, Track } from "@/lib/types/playlist";
import { Button } from "@/components/ui/button";
import { Music, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTrackDialog } from "@/components/playlist/add-track-dialog";

interface PlaylistSidebarProps {
  playlist: Playlist | null;
  currentPlaylistId: string | null;
  currentTrackIndex: number;
  isPlaying: boolean;
  onTrackClick: (index: number) => void;
  onRemoveTrack: (trackId: string) => void;
  onAddTrack: (playlistId: string, track: Omit<Track, "addedAt">) => void;
}

export function PlaylistSidebar({
  playlist,
  currentPlaylistId,
  currentTrackIndex,
  isPlaying,
  onTrackClick,
  onRemoveTrack,
  onAddTrack,
}: PlaylistSidebarProps) {
  return (
    <div className="flex w-[320px] shrink-0 flex-col overflow-hidden border-r border-white/5 bg-black/30 backdrop-blur-xl">
      <div className="border-b border-white/5 px-6 py-5">
        <p className="text-[11px] uppercase tracking-[0.25em] text-white/50">
          Playlist
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight">
          {playlist?.name || "No Playlist"}
        </h2>
        {playlist?.description && (
          <p className="text-sm text-muted-foreground">
            {playlist.description}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {playlist?.tracks.length || 0} tracks • Always in sync
          </p>
          <AddTrackDialog
            playlist={playlist}
            currentPlaylistId={currentPlaylistId}
            onAddTrack={onAddTrack}
            triggerClassName="h-9 px-3"
          />
        </div>
      </div>

      <div className="flex-1">
        {!playlist || playlist.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">No tracks yet</p>
            <p className="text-xs text-muted-foreground/60">
              Click "Add Track" to get started
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-4">
            {playlist.tracks.map((track, index) => {
              const isCurrentTrack = currentTrackIndex === index;
              return (
                <TrackItem
                  key={`${track.id}-${track.addedAt}`}
                  track={track}
                  isCurrentTrack={isCurrentTrack}
                  isPlaying={isPlaying && isCurrentTrack}
                  onClick={() => onTrackClick(index)}
                  onRemove={() => onRemoveTrack(track.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface TrackItemProps {
  track: Track;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onClick: () => void;
  onRemove: () => void;
}

function TrackItem({
  track,
  isCurrentTrack,
  isPlaying,
  onClick,
  onRemove,
}: TrackItemProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-transparent p-3 trans cursor-pointer hover:bg-white/5 hover:border-white/10",
        isCurrentTrack &&
          "bg-white/5 border-white/10 shadow-[0_10px_40px_-25px_rgba(0,0,0,0.8)]",
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={track.thumbnailUrl}
          alt={track.title}
          fill
          sizes="48px"
          className="object-cover"
        />
        {isPlaying && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-3 bg-white animate-pulse" />
              <div className="w-0.5 h-4 bg-white animate-pulse delay-75" />
              <div className="w-0.5 h-3 bg-white animate-pulse delay-150" />
            </div>
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium text-white/90",
            isCurrentTrack && "text-white",
          )}
        >
          {track.title}
        </p>
        <p className="truncate text-xs text-muted-foreground">{track.author}</p>
      </div>

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
