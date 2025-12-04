"use client";

import * as React from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { DEFAULT_PLAYLIST_TRACKS } from "@/lib/constants";

/**
 * Hook to initialize default playlist on first load
 * Creates a default playlist if none exists, and sets the current playlist
 * if playlists exist but no current playlist is selected
 */
export function useInitializePlaylist() {
  const playlists = usePlaylistStore((state) => state.playlists);
  const currentPlaylistId = usePlaylistStore(
    (state) => state.currentPlaylistId
  );
  const setCurrentPlaylist = usePlaylistStore(
    (state) => state.setCurrentPlaylist
  );
  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);

  const hasMounted = React.useRef(false);

  React.useEffect(() => {
    // Prevent double-initialization in strict mode
    if (hasMounted.current) return;
    hasMounted.current = true;

    if (playlists.length === 0) {
      createPlaylist(
        "My Playlist",
        "Your music collection",
        DEFAULT_PLAYLIST_TRACKS
      );
      setTimeout(() => {
        const newPlaylists = usePlaylistStore.getState().playlists;
        if (newPlaylists.length > 0) {
          setCurrentPlaylist(newPlaylists[0].id);
        }
      }, 100);
    } else if (!currentPlaylistId && playlists.length > 0) {
      setCurrentPlaylist(playlists[0].id);
    }
  }, [playlists.length, currentPlaylistId, createPlaylist, setCurrentPlaylist]);
}


