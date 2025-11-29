"use client";

import * as React from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { AnimatedPlayerHeader } from "@/components/player/animated-player-header";
import { PlaylistSidebar } from "@/components/playlist/playlist-sidebar";
import { DEFAULT_PLAYLIST_TRACKS } from "@/lib/constants";

export default function Home() {
  const { playlists, currentPlaylistId, setCurrentPlaylist, createPlaylist } =
    usePlaylistStore();

  // Initialize YouTube player
  useYouTubePlayer();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Initialize default playlist
  React.useEffect(() => {
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
  }, []);

  return (
    <main className="min-h-screen w-full bg-[#050505] text-white">
      {/* Hidden YouTube player */}
      <div className="absolute left-[-9999px] h-px w-px" aria-hidden="true">
        <div id="youtube-player" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 pb-16 pt-8 sm:px-6">
        <AnimatedPlayerHeader />

        <section
          aria-label="Playlist"
          className="mt-8 md:mt-12 motion-preset-slide-up-sm"
        >
          <PlaylistSidebar />
        </section>
      </div>
    </main>
  );
}
