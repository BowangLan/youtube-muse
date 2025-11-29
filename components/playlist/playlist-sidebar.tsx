"use client";

import Image from "next/image";
import type { Track } from "@/lib/types/playlist";
import { Button } from "@/components/ui/button";
import { Music, Trash2 } from "lucide-react";
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
  const { isPlaying, togglePlay } = usePlayerStore();

  if (!hasMounted) {
    return (
      <div className="space-y-2 text-neutral-500 motion-preset-fade-sm">
        <p className="text-xs uppercase tracking-[0.3em]">playlist</p>
        <p>Loading…</p>
      </div>
    );
  }

  const playlist = playlists.find((p) => p.id === currentPlaylistId);

  const handleTrackClick = (index: number) => {
    if (currentTrackIndex === index) {
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
  return (
    <div className="space-y-4 motion-translate-y-in-[20px] motion-blur-in-md motion-opacity-in-0 motion-delay-300">
      <div className="flex items-center justify-between gap-3 text-neutral-400">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em]">playlist</p>
          <h2 className="text-xl font-light text-white">
            {playlist?.name || "Untitled"}
          </h2>
          <p className="text-xs">{playlist?.tracks.length || 0} tracks</p>
        </div>
        <AddTrackDialog
          playlist={playlist || null}
          currentPlaylistId={currentPlaylistId}
          onAddTrack={addTrackToPlaylist}
          triggerClassName="rounded-full border border-white/20 bg-transparent text-white"
        />
      </div>

      {!playlist || playlist.tracks.length === 0 ? (
        <div className="flex flex-col items-start gap-2 text-sm text-neutral-500">
          <Music className="h-5 w-5" />
          <p>No tracks yet. Use the plus icon to add one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {playlist.tracks.map((track, index) => {
            const isCurrentTrack = currentTrackIndex === index;
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
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
      <div className="flex items-end gap-[3px] h-4">
        {isPlaying ? (
          <>
            <div className="w-[3px] h-full bg-white rounded-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-300" />
            <div className="w-[3px] h-full bg-white rounded-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-600" />
            <div className="w-[3px] h-full bg-white rounded-full motion-scale-y-loop-50 motion-duration-1500 motion-linear motion-delay-900" />
          </>
        ) : (
          <>
            <div className="w-[3px] h-full bg-white scale-y-[0.5]" />
            <div className="w-[3px] h-full bg-white scale-y-[0.5]" />
            <div className="w-[3px] h-full bg-white scale-y-[0.5]" />
          </>
        )}
      </div>
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
        "group flex items-center gap-3 rounded-xl px-2 py-2 text-left cursor-pointer",
        isCurrentTrack ? "bg-white/10" : "hover:bg-white/5"
      )}
      onClick={onClick}
    >
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg">
        <Image
          src={track.thumbnailUrl}
          alt={track.title}
          fill
          sizes="44px"
          className="object-cover"
        />
        {isCurrentTrack && <PlayingIndicator isPlaying={_isPlaying} />}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm text-white",
            !isCurrentTrack && "text-white/80"
          )}
        >
          {track.title}
        </p>
        <p className="truncate text-xs text-neutral-500">{track.author}</p>
      </div>

      <div className="flex items-center gap-2 justify-end mx-2">
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
      </div>
    </div>
  );
}
