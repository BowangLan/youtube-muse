"use client";

import { Music } from "lucide-react";
import { AddTrackDialog } from "@/components/playlist/add-track-dialog";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { TrackItem } from "./track-item";

export function PlaylistSection() {
  const {
    playlists,
    currentPlaylistId,
    currentTrackIndex,
    getCurrentActualTrackIndex,
    setCurrentTrackIndex,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = usePlaylistStore();
  const { togglePlay, apiReady } = usePlayerStore();

  const playlist = playlists.find((p) => p.id === currentPlaylistId);
  const currentActualTrackIndex = getCurrentActualTrackIndex();

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

  if (!apiReady) {
    return null;
  }

  return (
    <div className="space-y-4 motion-blur-in-md motion-opacity-in-0 motion-delay-800">
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
    </div>
  );
}
