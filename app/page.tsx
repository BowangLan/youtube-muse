"use client";

import * as React from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import {
  AppFooter,
  AppFooterMobileBottom,
  AppFooterFixed,
} from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { usePlayerStore } from "@/lib/store/player-store";
import { useAppStateStore } from "@/lib/store/app-state-store";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { useStreamsStore } from "@/lib/store/streams-store";
import { AppLoadingUI } from "@/components/layout/app-loading-ui";
import { useInitializePlaylist } from "@/hooks/use-initialize-playlist";
import { AnimatedBackground } from "@/components/player/animated-background";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { INTENTS } from "@/lib/intents";
import { IntentGridSection } from "@/components/intent/intent-grid-section";
import { IntentDetailSection } from "@/components/intent/intent-detail-section";
import { StreamGridSection } from "@/components/stream/stream-grid-section";
import { StreamDetailSection } from "@/components/stream/stream-detail-section";
import { MiniPlayerViewDesktop } from "@/components/v3/mini-player-view";
import { MiniPlayerViewMobile } from "@/components/v3/mini-player-view-mobile";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence } from "motion/react";

export default function Home() {
  const hasMounted = useHasMounted();
  const isMobile = useIsMobile();

  const playlists = usePlaylistStore((state) => state.playlists);

  // Initialize YouTube player
  useYouTubePlayer();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  useInitializePlaylist();

  const apiReady = usePlayerStore((state) => state.apiReady);

  const view = useAppStateStore((state) => state.view);
  const customIntents = useCustomIntentsStore((state) => state.customIntents);
  const hiddenBuiltInIntents = useCustomIntentsStore(
    (state) => state.hiddenBuiltInIntents
  );
  const streams = useStreamsStore((state) => state.streams);
  const refreshAllStreams = useStreamsStore((state) => state.refreshAllStreams);

  const intentPlaylists = React.useMemo(() => {
    const intentNames = new Set(INTENTS.map((i) => i.name));
    const hiddenNames = new Set(hiddenBuiltInIntents);
    return playlists
      .filter((p) => intentNames.has(p.name) && !hiddenNames.has(p.name))
      .sort(
        (a, b) =>
          INTENTS.findIndex((i) => i.name === a.name) -
          INTENTS.findIndex((i) => i.name === b.name)
      );
  }, [playlists, hiddenBuiltInIntents]);

  // Get playlists for custom intents
  const customIntentPlaylists = React.useMemo(() => {
    const customPlaylistIds = new Set(customIntents.map((ci) => ci.playlistId));
    return playlists.filter((p) => customPlaylistIds.has(p.id));
  }, [playlists, customIntents]);

  // Get playlists for streams
  const streamPlaylists = React.useMemo(() => {
    const streamPlaylistIds = new Set(streams.map((s) => s.playlistId));
    return playlists.filter((p) => streamPlaylistIds.has(p.id));
  }, [playlists, streams]);

  // Auto-refresh streams on mount
  React.useEffect(() => {
    if (hasMounted && apiReady && streams.length > 0) {
      // Non-blocking background refresh
      refreshAllStreams().catch((error) => {
        console.error("Error refreshing streams:", error);
      });
    }
  }, [hasMounted, apiReady, refreshAllStreams, streams.length]);

  // Show loading UI if not mounted (prevents hydration mismatch) or API not ready
  if (!hasMounted || !apiReady) {
    return <AppLoadingUI />;
  }

  return (
    <main className="min-h-screen w-full bg-[#050505] text-white">
      {/* Animated background based on current track */}
      <AnimatedBackground />

      {/* Hidden YouTube player */}
      <div className="absolute left-[-9999px] h-px w-px" aria-hidden="true">
        <div id="youtube-player" />
      </div>

      {/* Mini Player View - bottom of the screen */}
      {isMobile ? <MiniPlayerViewMobile /> : <MiniPlayerViewDesktop />}

      <div className="mx-auto flex min-h-screen w-full max-w-4xl space-y-8 md:space-y-10 flex-col px-4 pb-16 pt-8 sm:px-6 z-10 isolate">
        <AppHeader />

        <AnimatePresence mode="wait" initial={false}>
          {view === "grid" ? (
            <>
              <IntentGridSection
                key="grid"
                intentPlaylists={intentPlaylists}
                customIntentPlaylists={customIntentPlaylists}
              />
              <StreamGridSection
                key="streams"
                streamPlaylists={streamPlaylists}
              />
            </>
          ) : view === "intent" ? (
            <IntentDetailSection key="detail" />
          ) : view === "stream" ? (
            <StreamDetailSection key="stream" />
          ) : null}
        </AnimatePresence>

        {isMobile ? <AppFooterMobileBottom /> : <AppFooterFixed />}
        <div className="h-3 w-full"></div>
      </div>
    </main>
  );
}
