"use client";

import * as React from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import {
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
import { Loader2, Search, X } from "lucide-react";
import { ChannelsDataLoader } from "@/components/data-loaders/channels-data-loader";
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog";
import { KeyboardFeedback } from "@/components/keyboard-feedback";
import { PlayUrlDialog } from "@/components/player/play-url-dialog";
import { LatestVideosSidebar } from "@/components/channels/latest-videos-sidebar";
import { searchYouTubeUnofficial, type SearchVideoResult } from "@/app/actions/youtube-search-unofficial";
import { parseDuration } from "@/lib/utils/youtube";
import {
  SEARCH_RESULTS_PLAYLIST_ID,
  useYouTubeSearchStore,
} from "@/lib/store/youtube-search-store";
import { YouTubeSearchResultsSection } from "@/components/search/youtube-search-results-section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  const hasMounted = useHasMounted();
  const isMobile = useIsMobile();

  const playlists = usePlaylistStore((state) => state.playlists);
  const currentPlaylistId = usePlaylistStore((state) => state.currentPlaylistId);
  const currentTrackIndex = usePlaylistStore((state) => state.currentTrackIndex);
  const isShuffleEnabled = usePlaylistStore((state) => state.isShuffleEnabled);
  const shuffleOrder = usePlaylistStore((state) => state.shuffleOrder);
  const setCurrentPlaylist = usePlaylistStore((state) => state.setCurrentPlaylist);
  const setCurrentTrackIndex = usePlaylistStore((state) => state.setCurrentTrackIndex);
  const ensurePlaylist = usePlaylistStore((state) => state.ensurePlaylist);
  const setPlaylistTracks = usePlaylistStore((state) => state.setPlaylistTracks);

  useYouTubePlayer();
  useKeyboardShortcuts();
  useInitializePlaylist();

  const apiReady = usePlayerStore((state) => state.apiReady);
  const dispatch = usePlayerStore((state) => state.dispatch);

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
  const query = useYouTubeSearchStore((state) => state.query);
  const isSearchActive = useYouTubeSearchStore((state) => state.isActive);
  const isSearching = useYouTubeSearchStore((state) => state.isSearching);
  const searchError = useYouTubeSearchStore((state) => state.error);
  const searchResults = useYouTubeSearchStore((state) => state.results);
  const setSearchQuery = useYouTubeSearchStore((state) => state.setQuery);
  const startSearch = useYouTubeSearchStore((state) => state.startSearch);
  const setSearchResults = useYouTubeSearchStore((state) => state.setResults);
  const setSearchError = useYouTubeSearchStore((state) => state.setError);
  const clearSearch = useYouTubeSearchStore((state) => state.clearSearch);

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

  const currentActualTrackIndex =
    isShuffleEnabled && shuffleOrder.length > 0
      ? (shuffleOrder[currentTrackIndex] ?? currentTrackIndex)
      : currentTrackIndex;
  const currentPlaylist = React.useMemo(
    () => playlists.find((playlist) => playlist.id === currentPlaylistId),
    [playlists, currentPlaylistId]
  );
  const currentVideoId =
    currentPlaylist?.tracks[currentActualTrackIndex]?.id ?? null;

  const handleSearchSubmit = React.useCallback(async () => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      clearSearch();
      return;
    }

    startSearch(normalizedQuery);
    try {
      const { results, error } = await searchYouTubeUnofficial(
        normalizedQuery,
        "video",
        "any"
      );
      if (error) {
        setSearchError(error);
        return;
      }

      const videoResults = results.filter(
        (result): result is SearchVideoResult => "videoId" in result
      );
      const filteredResults = videoResults.filter(
        (result) => /^[a-zA-Z0-9_-]{11}$/.test(result.videoId)
      );
      const uniqueResults = Array.from(
        new Map(filteredResults.map((result) => [result.videoId, result])).values()
      );
      setSearchResults(uniqueResults);
    } catch (error) {
      console.error("YouTube search failed:", error);
      setSearchError("Failed to search videos. Please try again.");
    }
  }, [query, clearSearch, setSearchError, setSearchResults, startSearch]);

  const handleSearchResultClick = React.useCallback(
    (index: number) => {
      const isSearchPlaylistActive = currentPlaylistId === SEARCH_RESULTS_PLAYLIST_ID;
      if (!isSearchPlaylistActive) {
        setCurrentPlaylist(SEARCH_RESULTS_PLAYLIST_ID);
        setCurrentTrackIndex(index);
        return;
      }

      if (currentActualTrackIndex === index) {
        dispatch({ type: "UserTogglePlay" });
        return;
      }

      setCurrentTrackIndex(index);
    },
    [
      currentActualTrackIndex,
      currentPlaylistId,
      dispatch,
      setCurrentPlaylist,
      setCurrentTrackIndex,
    ]
  );

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

          {/* Global Toolbar */}
          <div className="mb-3 flex flex-none flex-col gap-3 sm:mb-4 sm:flex-row sm:items-center">
            <PlayUrlDialog />
            <form
              className="flex w-full items-center gap-2 sm:max-w-2xl"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSearchSubmit();
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
                <Input
                  value={query}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search YouTube videos..."
                  className="h-10 rounded-xl border-white/10 bg-white/5 pl-9 pr-10 text-white placeholder:text-white/35"
                />
                {isSearching ? (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/45" />
                ) : null}
              </div>
              {isSearchActive ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearSearch}
                  className="h-10 rounded-xl border-white/15 bg-white/5 px-3 text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              ) : null}
              <Button
                type="submit"
                disabled={!query.trim() || isSearching}
                className="h-10 rounded-xl bg-white px-5 text-black hover:bg-white/90"
              >
                Search
              </Button>
            </form>
          </div>

          {/* Main Content */}
          <AnimatePresence mode="wait" initial={false}>
            {isSearchActive ? (
              <div className="h-full min-h-0">
                <YouTubeSearchResultsSection
                  query={query}
                  isSearching={isSearching}
                  error={searchError}
                  results={searchResults}
                  currentVideoId={currentVideoId}
                  onResultClick={handleSearchResultClick}
                />
              </div>
            ) : view === "grid" ? (
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
