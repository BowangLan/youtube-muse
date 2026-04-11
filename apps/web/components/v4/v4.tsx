"use client";

import * as React from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { usePlayerStore } from "@/lib/store/player-store";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { AppLoadingUI } from "@/components/layout/app-loading-ui";
import { useInitializePlaylist } from "@/hooks/use-initialize-playlist";
import { AnimatedBackground } from "@/components/player/animated-background";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { MiniPlayerViewDesktop } from "@/components/v3/mini-player-view";
import { MiniPlayerViewMobile } from "@/components/v3/mini-player-view-mobile";
import { useIsMobile } from "@/hooks/use-mobile";
import { YouTubePlayerContainer } from "@/components/player/youtube-player-container";
import { ChannelsDataLoader } from "@/components/data-loaders/channels-data-loader";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { KeyboardFeedback } from "@/components/keyboard-feedback";
import { DesktopPlayerSync } from "@/components/desktop/desktop-player-sync";
import { parseDuration } from "@/lib/utils/youtube";
import {
  SEARCH_RESULTS_PLAYLIST_ID,
  useYouTubeSearchStore,
} from "@/lib/store/youtube-search-store";
import { cn } from "@/lib/utils";
import { V4TabsContent } from "./v4-tabs-content";
import { V4Header } from "./v4-header";
import V1Sidebar from "./v4-sidebar";
import { useV4AppStateStore } from "@/lib/store/v4-app-state-store";
import { Focus } from "./focus/focus";
import { AnimatePresence, motion } from "motion/react";
import { EASING_EASE_OUT } from "@/lib/styles/animation";
import { V4_HEADER_HEIGHT, V4_PAGE_P, V4_SIDEBAR_COLLAPSED_WIDTH, V4_SIDEBAR_WIDTH } from "./v4-constants";
import { V4MainContentHeader } from "./v4-main-content-header";

export default function Home() {
  const hasMounted = useHasMounted();
  const isMobile = useIsMobile();
  const ensurePlaylist = usePlaylistStore((state) => state.ensurePlaylist);
  const setPlaylistTracks = usePlaylistStore((state) => state.setPlaylistTracks);
  const isFocusMode = useV4AppStateStore((state) => state.isFocusMode);
  const sidebarCollapsed = useV4AppStateStore((state) => state.sidebarCollapsed);

  useYouTubePlayer();
  useKeyboardShortcuts();
  useInitializePlaylist();

  const apiReady = usePlayerStore((state) => state.apiReady);

  const searchResults = useYouTubeSearchStore((state) => state.results);

  const searchTracks = React.useMemo(
    () =>
      searchResults.map((result, index) => ({
        id: result.videoId,
        title: result.title,
        author: result.channelTitle,
        authorUrl: `https://www.youtube.com/channel/${result.channelId}`,
        duration: parseDuration(result.lengthText),
        thumbnailUrl: result.thumbnail.startsWith("//")
          ? `https:${result.thumbnail}`
          : result.thumbnail,
        addedAt: index,
        publishedAt: undefined,
        publishedTimeText: result.publishedTime,
      })),
    [searchResults]
  );

  React.useEffect(() => {
    ensurePlaylist(
      SEARCH_RESULTS_PLAYLIST_ID,
      "Search Results",
      "YouTube video search results",
      searchTracks
    );
    const playlistState = usePlaylistStore.getState();
    const isPlayingFromSearch =
      playlistState.currentPlaylistId === SEARCH_RESULTS_PLAYLIST_ID;
    const currentTrack = isPlayingFromSearch
      ? playlistState.getCurrentTrack()
      : null;

    // Keep the currently playing search track in the playlist if it is not in the new results,
    // so a new search cannot implicitly switch playback to the same index in the new list.
    const nextTracks =
      currentTrack &&
        !searchTracks.some((track) => track.id === currentTrack.id)
        ? [
          ...searchTracks.slice(0, playlistState.currentTrackIndex),
          currentTrack,
          ...searchTracks.slice(playlistState.currentTrackIndex),
        ]
        : searchTracks;

    setPlaylistTracks(SEARCH_RESULTS_PLAYLIST_ID, nextTracks);
  }, [ensurePlaylist, searchTracks, setPlaylistTracks]);

  if (!hasMounted || !apiReady) {
    return <AppLoadingUI />;
  }

  return (
    <main
      className="h-screen w-screen grid grid-rows-1"
      style={{
        "--v4-sidebar-width": `${sidebarCollapsed ? V4_SIDEBAR_COLLAPSED_WIDTH : V4_SIDEBAR_WIDTH}px`,
        "--v4-header-height": `${V4_HEADER_HEIGHT}px`,
        gridTemplateColumns: `var(--v4-sidebar-width) 1fr`,
        padding: V4_PAGE_P,
        gap: V4_PAGE_P,
        transition: "grid-template-columns 350ms cubic-bezier(0.4,0,0.2,1)",
      } as React.CSSProperties}
    >
      <AnimatedBackground />

      <ChannelsDataLoader />
      <DesktopPlayerSync />

      <YouTubePlayerContainer />

      <AnimatePresence>
        {/* Animation didn't work yet with focus mode yet */}
        {isFocusMode ? null : (
          <motion.div
            key="mini-player"
            className="z-100 fixed bottom-0 left-0 right-0 pointer-events-none"
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: EASING_EASE_OUT } }}
            exit={{ opacity: 0, y: -100, transition: { duration: 0.3, ease: EASING_EASE_OUT } }}
          >
            {isMobile ? <MiniPlayerViewMobile /> : <MiniPlayerViewDesktop />}
          </motion.div>
        )}
      </AnimatePresence>

      <KeyboardShortcutsDialog />
      <KeyboardFeedback />

      <Focus />

      <AnimatePresence initial={false}>
        {!isFocusMode ? (
          <>
            <V1Sidebar />
            <motion.div
              key="main-content"
              initial={{ opacity: 0, }}
              animate={{ opacity: 1, transition: { duration: 0.3, ease: EASING_EASE_OUT } }}
              exit={{ opacity: 0, transition: { duration: 0.3, ease: EASING_EASE_OUT } }}
              className={cn("flex min-h-0 flex-col z-10 isolate relative")}
            >
              {/* <V4Header /> */}
              <V4MainContentHeader />
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="flex-none" style={{ height: V4_HEADER_HEIGHT }}></div>
                <V4TabsContent />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
