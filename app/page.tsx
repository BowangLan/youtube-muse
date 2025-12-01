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
import { useInitializePlaylist } from "@/hooks/use-initialize-playlist";

export default function Home() {
  usePlaylistStore();

  // Initialize YouTube player
  useYouTubePlayer();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  useInitializePlaylist();

  const apiReady = usePlayerStore((state) => state.apiReady);

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
