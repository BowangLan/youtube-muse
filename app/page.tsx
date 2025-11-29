"use client";

import * as React from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { PlayerControls } from "@/components/player/player-controls";
import { NowPlaying } from "@/components/player/now-playing";
import { PlaylistSidebar } from "@/components/playlist/playlist-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { DEFAULT_PLAYLIST_TRACKS } from "@/lib/constants";

export default function Home() {
  const hasMounted = useHasMounted();
  const {
    playlists,
    currentPlaylistId,
    setCurrentPlaylist,
    createPlaylist,
    getCurrentTrack,
  } = usePlaylistStore();

  // Initialize YouTube player
  useYouTubePlayer();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const currentTrack = hasMounted ? getCurrentTrack() : null;

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
    <main className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#0a0c10] via-[#090a0f] to-[#050507] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(45,212,191,0.06),transparent_25%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.04),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0)_35%),linear-gradient(300deg,rgba(255,255,255,0.02)_10%,rgba(255,255,255,0)_40%)]" />
      </div>

      {/* Hidden YouTube player */}
      <div className="absolute left-[-9999px] h-px w-px" aria-hidden="true">
        <div id="youtube-player" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <AppHeader />

        <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-10 pt-4 sm:px-6 lg:flex-row lg:gap-8 lg:pt-6">
          <aside aria-label="Playlists" className="contents">
            <PlaylistSidebar />
          </aside>

          <section
            className="flex flex-1 justify-center lg:items-start"
            aria-label="Music player"
          >
            <div className="flex w-full max-w-4xl flex-1 flex-col gap-6 xl:max-w-5xl">
              <NowPlaying />

              {currentTrack && <PlayerControls />}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
