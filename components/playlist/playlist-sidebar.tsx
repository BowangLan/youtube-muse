"use client";

import Image from "next/image";
import type { Track } from "@/lib/types/playlist";
import { Button } from "@/components/ui/button";
import { Copy, Music, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddTrackDialog } from "@/components/playlist/add-track-dialog";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { useHasMounted } from "@/hooks/use-has-mounted";

export function PlaylistSidebar() {
  const hasMounted = useHasMounted();
  const {
    playlists,
    currentPlaylistId,
    currentTrackIndex,
    setCurrentTrackIndex,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = usePlaylistStore();
  const { isPlaying } = usePlayerStore();

  if (!hasMounted) {
    return (
      <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl lg:h-[calc(100vh-180px)] lg:w-[340px] lg:shrink-0 lg:rounded-3xl lg:border-b-0 lg:border-r lg:bg-black/10">
        <div className="border-b border-white/5 px-5 py-4 sm:px-6 sm:py-5">
          <p className="text-[11px] uppercase tracking-[0.25em] text-white/50">
            Playlist
          </p>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  const playlist = playlists.find((p) => p.id === currentPlaylistId);

  const handleTrackClick = (index: number) => {
    setCurrentTrackIndex(index);
  };

  const handleRemoveTrack = (trackId: string) => {
    if (currentPlaylistId) {
      removeTrackFromPlaylist(currentPlaylistId, trackId);
    }
  };
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-black/20 backdrop-blur-xl lg:h-[calc(100vh-180px)] lg:w-[340px] lg:shrink-0 lg:rounded-3xl lg:border-b-0 lg:border-r lg:bg-black/10">
      <div className="sticky top-0 z-10 border-b border-white/5 bg-white/5 px-5 py-4 backdrop-blur-xl sm:px-6 sm:py-5">
        <p className="text-[11px] uppercase tracking-[0.25em] text-white/50">
          Playlist
        </p>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            {playlist?.name || "No Playlist"}
          </h2>
          <div className="flex items-center gap-2 sm:ml-auto">
            <AddTrackDialog
              playlist={playlist || null}
              currentPlaylistId={currentPlaylistId}
              onAddTrack={addTrackToPlaylist}
              triggerClassName="h-9 px-3"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {playlist?.tracks.length || 0} tracks
        </p>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Copy tracks as json  */}
        {/* <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            navigator.clipboard.writeText(
              JSON.stringify(playlist?.tracks, null, 2)
            );
          }}
        >
          <Copy className="h-4 w-4" />
        </Button> */}

        {!playlist || playlist.tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center sm:py-16">
            <Music className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-sm text-muted-foreground">No tracks yet</p>
            <p className="text-xs text-muted-foreground/60">
              Click "Add Track" to get started
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-4 sm:p-5">
            {playlist.tracks.map((track, index) => {
              const isCurrentTrack = currentTrackIndex === index;
              return (
                <TrackItem
                  key={`${track.id}-${track.addedAt}`}
                  track={track}
                  isCurrentTrack={isCurrentTrack}
                  isPlaying={isPlaying && isCurrentTrack}
                  onClick={() => handleTrackClick(index)}
                  onRemove={() => handleRemoveTrack(track.id)}
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
          "bg-white/5 border-white/10 shadow-[0_10px_40px_-25px_rgba(0,0,0,0.8)]"
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
            isCurrentTrack && "text-white"
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
