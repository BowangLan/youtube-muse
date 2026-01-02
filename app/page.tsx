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
import { GridTab, useAppStateStore } from "@/lib/store/app-state-store";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CircleHelp,
  ListMusic,
  ListVideo,
  Radio,
  Search,
  Sparkles,
} from "lucide-react";
import type { GridTab as GridTabType } from "@/lib/store/app-state-store";
import { StreamDataLoader } from "@/components/data-loaders/stream-data-loader";

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

const STREAM_HELP_STEPS = [
  {
    title: "Channels",
    description: "Each stream keeps a curated channel list.",
    icon: Radio,
  },
  {
    title: "Latest Videos",
    description: "Opening a stream fetches the newest uploads.",
    icon: ListVideo,
  },
  {
    title: "Playlist",
    description: "Those videos become a fresh, ready-to-play queue.",
    icon: ListMusic,
  },
] as const;

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
  const gridTab = useAppStateStore((state) => state.gridTab);
  const setGridTab = useAppStateStore((state) => state.setGridTab);
  const customIntents = useCustomIntentsStore((state) => state.customIntents);
  const hiddenBuiltInIntents = useCustomIntentsStore(
    (state) => state.hiddenBuiltInIntents
  );
  const streams = useStreamsStore((state) => state.streams);

  React.useEffect(() => {
    if (view === "intent") {
      setGridTab("intents");
    }
    if (view === "stream") {
      setGridTab("streams");
    }
  }, [view, setGridTab]);

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

  // Show loading UI if not mounted (prevents hydration mismatch) or API not ready
  if (!hasMounted || !apiReady) {
    return <AppLoadingUI />;
  }

  return (
    <main className="min-h-screen w-full bg-[#050505] text-white">
      {/* <div className="absolute top-6 left-6 rounded-xl w-[700px] h-[200px] z-100 pointer-events-none bg-glass" /> */}

      {/* Animated background based on current track */}
      <AnimatedBackground />

      {streams.map((stream) => (
        <StreamDataLoader key={stream.id} stream={stream} />
      ))}

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
            <Tabs
              value={gridTab}
              // @ts-expect-error - this is a valid type
              onValueChange={setGridTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start sm:w-fit">
                <TabsTrigger value="intents" className="sm:flex-none">
                  Intents
                </TabsTrigger>
                <TabsTrigger value="streams" className="sm:flex-none">
                  Streams
                </TabsTrigger>
              </TabsList>
              <TabsContent value="intents">
                <div className="mt-2 space-y-4">
                  <Accordion
                    type="single"
                    collapsible
                    className="rounded-2xl px-4 border border-white/5 bg-white/3"
                  >
                    <AccordionItem value="intents" className="border-white/10">
                      <AccordionTrigger className="cursor-pointer flex items-center justify-start gap-3 text-xs uppercase tracking-[0.32em] text-white/60 hover:no-underline">
                        <CircleHelp className="size-4 text-white/60" />
                        <span className="flex-1 inline-block">
                          How intents work
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2">
                        <div className="grid gap-3 pb-2 sm:grid-cols-3">
                          {INTENT_HELP_STEPS.map(
                            ({ title, description, icon }) => {
                              const Icon = icon;
                              return (
                                <div
                                  key={title}
                                  className="flex items-start gap-3 rounded-xl text-left transition-colors p-3 border border-white/5 bg-white/5 hover:bg-white/10"
                                >
                                  <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80">
                                    <Icon className="size-4" />
                                  </div>
                                  <div className="flex flex-1 flex-col gap-1">
                                    <div className="text-sm font-medium text-white">
                                      {title}
                                    </div>
                                    <p className="text-xs text-white/60">
                                      {description}
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <IntentGridSection
                    intentPlaylists={intentPlaylists}
                    customIntentPlaylists={customIntentPlaylists}
                  />
                </div>
              </TabsContent>
              <TabsContent value="streams">
                <div className="mt-2 space-y-4">
                  <Accordion
                    type="single"
                    collapsible
                    className="rounded-2xl px-4 border border-white/5 bg-white/3"
                  >
                    <AccordionItem value="streams" className="border-white/10">
                      <AccordionTrigger className="cursor-pointer flex items-center justify-start gap-3 text-xs uppercase tracking-[0.32em] text-white/60 hover:no-underline">
                        <CircleHelp className="size-4 text-white/60" />
                        <span className="flex-1 inline-block">
                          How streams work
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2">
                        <div className="grid gap-3 pb-2 sm:grid-cols-3">
                          {STREAM_HELP_STEPS.map(
                            ({ title, description, icon }) => {
                              const Icon = icon;
                              return (
                                <div
                                  key={title}
                                  className="flex items-start gap-3 rounded-xl text-left transition-colors p-3 border border-white/5 bg-white/5 hover:bg-white/10"
                                >
                                  <div className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80">
                                    <Icon className="size-4" />
                                  </div>
                                  <div className="flex flex-1 flex-col gap-1">
                                    <div className="text-sm font-medium text-white">
                                      {title}
                                    </div>
                                    <p className="text-xs text-white/60">
                                      {description}
                                    </p>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <StreamGridSection streamPlaylists={streamPlaylists} />
                </div>
              </TabsContent>
            </Tabs>
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
