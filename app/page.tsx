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
import { AppLoadingUI } from "@/components/layout/app-loading-ui";
import { useInitializePlaylist } from "@/hooks/use-initialize-playlist";
import { AnimatedBackground } from "@/components/player/animated-background";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { IntentGridSection } from "@/components/intent/intent-grid-section";
import { IntentDetailSection } from "@/components/intent/intent-detail-section";
import { MiniPlayerViewDesktop } from "@/components/v3/mini-player-view";
import { MiniPlayerViewMobile } from "@/components/v3/mini-player-view-mobile";
import { useIsMobile } from "@/hooks/use-mobile";
import { YouTubePlayerContainer } from "@/components/player/youtube-player-container";
import { FloatingPlayerPlaceholder } from "@/components/player/floating-player-placeholder";
import { AnimatePresence } from "motion/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListMusic, Search, Sparkles } from "lucide-react";
import { FeatureHelpAccordion } from "@/components/ui/feature-help-accordion";
import { ChannelsDataLoader } from "@/components/data-loaders/channels-data-loader";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { KeyboardFeedback } from "@/components/keyboard-feedback";
import { PlayUrlDialog } from "@/components/player/play-url-dialog";
import { LatestVideosSidebar } from "@/components/channels/latest-videos-sidebar";
import { cn } from "@/lib/utils";

const INTENT_HELP_STEPS = [
  {
    title: "Keywords",
    description: "Each intent stores a set of search keywords.",
    icon: Sparkles,
  },
  {
    title: "YouTube Fetch",
    description: "Tracks are pulled from YouTube using those keywords.",
    icon: Search,
  },
  {
    title: "Playlist",
    description: "Results become a focused playlist for that intent.",
    icon: ListMusic,
  },
] as const;

export default function Home() {
  const hasMounted = useHasMounted();
  const isMobile = useIsMobile();

  const playlists = usePlaylistStore((state) => state.playlists);

  useYouTubePlayer();
  useKeyboardShortcuts();
  useInitializePlaylist();

  const apiReady = usePlayerStore((state) => state.apiReady);

  const view = useAppStateStore((state) => state.view);
  const setGridTab = useAppStateStore((state) => state.setGridTab);
  const intentMetadataByPlaylistId = useCustomIntentsStore(
    (state) => state.intentMetadataByPlaylistId
  );
  const intentPlaylistOrder = useCustomIntentsStore(
    (state) => state.intentPlaylistOrder
  );
  const hiddenBuiltInIntents = useCustomIntentsStore(
    (state) => state.hiddenBuiltInIntents
  );

  React.useEffect(() => {
    if (view === "intent") {
      setGridTab("intents");
    }
  }, [view, setGridTab]);

  const intentPlaylists = React.useMemo(() => {
    const hiddenNames = new Set(hiddenBuiltInIntents);
    const playlistById = new Map(
      playlists.map((playlist) => [playlist.id, playlist])
    );
    return intentPlaylistOrder.flatMap((playlistId) => {
      const playlist = playlistById.get(playlistId);
      if (!playlist) return [];
      const intent = intentMetadataByPlaylistId[playlistId];
      if (!intent) return [];
      if (!intent.isCustom && hiddenNames.has(intent.name)) return [];
      return [playlist];
    });
  }, [
    playlists,
    hiddenBuiltInIntents,
    intentMetadataByPlaylistId,
    intentPlaylistOrder,
  ]);

  if (!hasMounted || !apiReady) {
    return <AppLoadingUI />;
  }

  return (
    <main className="h-screen w-full overflow-hidden bg-[#050505]">
      <AnimatedBackground />

      <ChannelsDataLoader />

      <YouTubePlayerContainer />

      {isMobile ? <MiniPlayerViewMobile /> : <MiniPlayerViewDesktop />}

      <KeyboardShortcutsDialog />
      <KeyboardFeedback />

      <div
        className={cn(
          "mx-auto flex h-full min-h-0 w-full flex-col space-y-6 px-4 pt-6 sm:space-y-8 sm:px-6 sm:pt-8 md:space-y-10 lg:px-8 z-10 isolate"
        )}
      >
        <AppHeader />

        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="flex flex-col flex-none gap-3 mb-3 sm:flex-row sm:items-center sm:mb-4">
            <PlayUrlDialog />
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {view === "grid" ? (
              <div className="grid h-full min-h-0 grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3 overflow-y-auto lg:overflow-y-hidden">
                <div className="min-h-0 lg:col-span-2 flex flex-col">
                  <div className="sticky top-0 z-10 h-12 backdrop-blur flex items-center">
                    <h2 className="h2">Intents</h2>
                  </div>
                  <div className="flex-none lg:flex-1 min-h-0 lg:overflow-y-auto">
                    <IntentGridSection intentPlaylists={intentPlaylists} />
                    <div className="h-(--bottom-spacing) flex-none"></div>
                  </div>
                </div>

                <LatestVideosSidebar className="flex-none lg:flex-1 min-h-0 lg:col-span-1 flex flex-col" />
              </div>
            ) : view === "intent" ? (
              <div className="h-full min-h-0 overflow-y-auto">
                <IntentDetailSection key="detail" />
              </div>
            ) : null}
          </AnimatePresence>
        </div>



        {isMobile ? <AppFooterMobileBottom /> : <AppFooterFixed />}
        <div className="h-3 w-full" />

        <FloatingPlayerPlaceholder />
      </div>
    </main>
  );
}
