"use client";

import * as React from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { AnimatedPlayerHeader } from "@/components/player/animated-player-header";
import { PlaylistSection } from "@/components/playlist/playlist-section";
import { AppFooter } from "@/components/layout/app-footer";
import { DEFAULT_PLAYLIST_TRACKS } from "@/lib/constants";
import { AppHeader } from "@/components/layout/app-header";
import { usePlayerStore } from "@/lib/store/player-store";
import { AppLoadingUI } from "@/components/layout/app-loading-ui";
import { StickyMiniPlayer } from "@/components/player/sticky-mini-player";

export default function Home() {
  const playlists = usePlaylistStore((state) => state.playlists);
  const currentPlaylistId = usePlaylistStore(
    (state) => state.currentPlaylistId
  );
  const setCurrentPlaylist = usePlaylistStore(
    (state) => state.setCurrentPlaylist
  );
  const createPlaylist = usePlaylistStore((state) => state.createPlaylist);
  usePlaylistStore();

  const apiReady = usePlayerStore((state) => state.apiReady);

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

  if (!apiReady) {
    return <AppLoadingUI />;
  }

  return (
    <main className="min-h-screen w-full bg-[#050505] text-white">
      {/* Hidden YouTube player */}
      <div className="absolute left-[-9999px] h-px w-px" aria-hidden="true">
        <div id="youtube-player" />
      </div>

      <StickyMiniPlayer />

      <div className="mx-auto flex min-h-screen w-full max-w-4xl space-y-8 md:space-y-10 flex-col px-4 pb-16 pt-8 sm:px-6">
        <AppHeader />

        <div className="space-y-12 md:space-y-16">
          <AnimatedPlayerHeader />

          <section aria-label="Playlist" className="motion-preset-slide-up-sm">
            <PlaylistSection />
            {/* <PlaylistSectionCardsVariant /> */}
          </section>
        </div>
      </div>

      <AppFooter />
    </main>
  );
}
