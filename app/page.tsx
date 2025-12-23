"use client";

import * as React from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { usePlayerStore } from "@/lib/store/player-store";
import { AppLoadingUI } from "@/components/layout/app-loading-ui";
import { useInitializePlaylist } from "@/hooks/use-initialize-playlist";
import { AnimatedBackground } from "@/components/player/animated-background";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { INTENTS, buildIntentQuery, getIntentByName } from "@/lib/intents";
import { searchYouTubeVideos } from "@/app/actions/youtube-search";
import { useShallow } from "zustand/shallow";
import { IntentGridSection } from "@/components/intent/intent-grid-section";
import { IntentDetailSection } from "@/components/intent/intent-detail-section";
import { MiniPlayerView } from "@/components/v3/mini-player-view";

export default function Home() {
  const hasMounted = useHasMounted();

  const {
    playlists,
    currentPlaylistId,
    setCurrentPlaylist,
    setCurrentTrackIndex,
    addTrackToPlaylist,
    currentTrackIndex,
    isShuffleEnabled,
    shuffleOrder,
  } = usePlaylistStore(
    useShallow((state) => ({
      playlists: state.playlists,
      currentPlaylistId: state.currentPlaylistId,
      currentTrackIndex: state.currentTrackIndex,
      isShuffleEnabled: state.isShuffleEnabled,
      shuffleOrder: state.shuffleOrder,
      setCurrentPlaylist: state.setCurrentPlaylist,
      setCurrentTrackIndex: state.setCurrentTrackIndex,
      addTrackToPlaylist: state.addTrackToPlaylist,
    }))
  );

  // Initialize YouTube player
  useYouTubePlayer();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  useInitializePlaylist();

  const { apiReady, togglePlay } = usePlayerStore(
    useShallow((state) => ({
      apiReady: state.apiReady,
      togglePlay: state.togglePlay,
    }))
  );

  const [view, setView] = React.useState<"grid" | "intent">("grid");
  const [isAdding, setIsAdding] = React.useState(false);

  const intentPlaylists = React.useMemo(() => {
    const intentNames = new Set(INTENTS.map((i) => i.name));
    return playlists
      .filter((p) => intentNames.has(p.name))
      .sort(
        (a, b) =>
          INTENTS.findIndex((i) => i.name === a.name) -
          INTENTS.findIndex((i) => i.name === b.name)
      );
  }, [playlists]);

  const activePlaylist = React.useMemo(() => {
    if (!currentPlaylistId) return undefined;
    return playlists.find((p) => p.id === currentPlaylistId);
  }, [currentPlaylistId, playlists]);

  const currentActualTrackIndex =
    isShuffleEnabled && shuffleOrder.length > 0
      ? shuffleOrder[currentTrackIndex] ?? currentTrackIndex
      : currentTrackIndex;

  const activeIntent = React.useMemo(
    () => getIntentByName(activePlaylist?.name),
    [activePlaylist?.name]
  );

  const openIntent = React.useCallback(
    (playlistId: string) => {
      setCurrentPlaylist(playlistId);
      // setView("intent");
    },
    [setCurrentPlaylist]
  );

  const closeIntent = React.useCallback(() => {
    setView("grid");
  }, []);

  const handleTrackClick = React.useCallback(
    (index: number) => {
      if (!currentPlaylistId) return;
      if (currentActualTrackIndex === index) {
        togglePlay();
      } else {
        setCurrentTrackIndex(index);
      }
    },
    [
      currentPlaylistId,
      currentActualTrackIndex,
      togglePlay,
      setCurrentTrackIndex,
    ]
  );

  const handleAddToIntent = React.useCallback(async () => {
    if (!currentPlaylistId) return;
    if (!activePlaylist) return;

    const intent = INTENTS.find((i) => i.name === activePlaylist.name);
    if (!intent) return;

    setIsAdding(true);
    try {
      const { results } = await searchYouTubeVideos(buildIntentQuery(intent));
      const existing = new Set(activePlaylist.tracks.map((t) => t.id));
      const next = results.find((r) => r?.id && !existing.has(r.id));
      if (!next) return;

      const thumb =
        next.thumbnail?.thumbnails?.[next.thumbnail.thumbnails.length - 1]
          ?.url ?? `https://i.ytimg.com/vi/${next.id}/hqdefault.jpg`;

      addTrackToPlaylist(currentPlaylistId, {
        id: next.id,
        title: next.title,
        author: next.channelTitle,
        authorUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
          next.channelTitle
        )}`,
        duration: 0,
        thumbnailUrl: thumb,
      });
    } finally {
      setIsAdding(false);
    }
  }, [
    INTENTS,
    activePlaylist,
    addTrackToPlaylist,
    buildIntentQuery,
    currentPlaylistId,
    searchYouTubeVideos,
  ]);

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
      <div className="fixed bottom-8 left-0 right-0 z-40 trans">
        <MiniPlayerView />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-4xl space-y-8 md:space-y-10 flex-col px-4 pb-16 pt-8 sm:px-6 z-10 isolate">
        <AppHeader />

        {view === "grid" ? (
          <IntentGridSection
            intentPlaylists={intentPlaylists}
            currentPlaylistId={currentPlaylistId}
            onOpenIntent={openIntent}
          />
        ) : (
          <IntentDetailSection
            activePlaylist={activePlaylist}
            activeIntent={activeIntent}
            currentActualTrackIndex={currentActualTrackIndex}
            canAdd={Boolean(currentPlaylistId)}
            isAdding={isAdding}
            onBack={closeIntent}
            onAdd={handleAddToIntent}
            onTrackClick={handleTrackClick}
          />
        )}
      </div>

      <AppFooter />
    </main>
  );
}
