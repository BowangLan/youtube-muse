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
import { FloatingPlayerPlaceholder } from "@/components/player/floating-player-placeholder";
import { ChannelsDataLoader } from "@/components/data-loaders/channels-data-loader";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { KeyboardFeedback } from "@/components/keyboard-feedback";
import { parseDuration } from "@/lib/utils/youtube";
import {
  SEARCH_RESULTS_PLAYLIST_ID,
  useYouTubeSearchStore,
} from "@/lib/store/youtube-search-store";
import { cn } from "@/lib/utils";
import { V4TabsContent } from "./v4-tabs-content";
import { V4Header } from "./v4-header";

export default function Home() {
  const hasMounted = useHasMounted();
  const isMobile = useIsMobile();
  const ensurePlaylist = usePlaylistStore((state) => state.ensurePlaylist);
  const setPlaylistTracks = usePlaylistStore((state) => state.setPlaylistTracks);

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
    setPlaylistTracks(SEARCH_RESULTS_PLAYLIST_ID, searchTracks);
  }, [ensurePlaylist, searchTracks, setPlaylistTracks]);

  if (!hasMounted || !apiReady) {
    return <AppLoadingUI />;
  }

  return (
    <main className="h-screen w-full overflow-y-auto bg-[#050505]">
      <AnimatedBackground />

      <ChannelsDataLoader />

      <YouTubePlayerContainer />

      {isMobile ? <MiniPlayerViewMobile /> : <MiniPlayerViewDesktop />}

      <KeyboardShortcutsDialog />
      <KeyboardFeedback />
      <FloatingPlayerPlaceholder />

      <div
        className={cn(
          "flex h-fit min-h-0 w-full flex-col z-10 isolate"
        )}
      >
        <V4Header />
        <V4TabsContent />
      </div>
    </main>
  );
}
