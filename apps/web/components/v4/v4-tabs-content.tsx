import {
  useV4AppStateStore,
  V4TabWithDetail,
} from "@/lib/store/v4-app-state-store";
import { AnimatePresence, motion } from "motion/react";
import { IntentDetailSection } from "../intent/intent-detail-section";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { useCustomPlaylistsStore } from "@/lib/store/custom-playlists-store";
import { useCallback, useMemo } from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { LatestVideosGrid } from "./tabs/latest-videos-grid";
import { V4TabContentHeader } from "./v4-tab-content-header";
import { YouTubeSearchResultsSection } from "../search/youtube-search-results-section";
import {
  SEARCH_RESULTS_PLAYLIST_ID,
  useYouTubeSearchStore,
} from "@/lib/store/youtube-search-store";
import { PlaylistCardGrid } from "../playlist/playlist-card-grid";
import { PlaylistDetailSection } from "../playlist/playlist-detail-section";
import { EASING_EASE_OUT } from "@/lib/styles/animation";
import { searchYouTubeUnofficial, type SearchVideoResult } from "@/app/actions/youtube-search-unofficial";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "@/components/ui/search";

function V4TabsContentPlaylists() {
  const intents = useCustomIntentsStore(
    (state) => state.intentPlaylistOrder
  );
  const customPlaylistIds = useCustomPlaylistsStore(
    (state) => state.customPlaylistIds
  );
  const playlists = usePlaylistStore((state) => state.playlists);

  const intentPlaylists = useMemo(() => {
    return intents.map((playlistId) => playlists.find((playlist) => playlist.id === playlistId)).filter((playlist) => playlist !== undefined);
  }, [intents, playlists]);

  const customPlaylists = useMemo(() => {
    const intentIds = new Set(intentPlaylists.map((playlist) => playlist.id));
    return customPlaylistIds
      .map((playlistId) => playlists.find((playlist) => playlist.id === playlistId))
      .filter(
        (playlist): playlist is NonNullable<typeof playlist> =>
          playlist !== undefined && !intentIds.has(playlist.id)
      );
  }, [customPlaylistIds, intentPlaylists, playlists]);

  const displayedPlaylists = useMemo(() => {
    return [...intentPlaylists, ...customPlaylists];
  }, [intentPlaylists, customPlaylists]);

  return (
    <motion.div
      // initial={{ opacity: 0, filter: "blur(10px)" }}
      // animate={{ opacity: 1, filter: "blur(0px)" }}
      // exit={{ opacity: 0, filter: "blur(10px)" }}
      // transition={{ duration: 0.4, ease: EASING_EASE_OUT }}
      className="mx-auto max-w-6xl"
    >
      <V4TabContentHeader title="Latest Videos" />
      <PlaylistCardGrid playlists={displayedPlaylists} />
      <div className="h-(--bottom-spacing) flex-none"></div>
    </motion.div>
  );
}

function V4TabsContentChannels() {
  return (
    <div>
      <LatestVideosGrid />
    </div>
  );
}

function SearchBar() {
  const query = useYouTubeSearchStore((state) => state.query);
  const isSearching = useYouTubeSearchStore((state) => state.isSearching);
  const setSearchQuery = useYouTubeSearchStore((state) => state.setQuery);
  const startSearch = useYouTubeSearchStore((state) => state.startSearch);
  const setSearchResults = useYouTubeSearchStore((state) => state.setResults);
  const setSearchError = useYouTubeSearchStore((state) => state.setError);
  const clearSearch = useYouTubeSearchStore((state) => state.clearSearch);
  const openSearch = useV4AppStateStore((state) => state.openSearch);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
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
          "any",
        );
        if (error) {
          setSearchError(error);
          return;
        }
        const videoResults = results.filter(
          (r): r is SearchVideoResult => "videoId" in r,
        );
        const filteredResults = videoResults.filter((r) =>
          /^[a-zA-Z0-9_-]{11}$/.test(r.videoId),
        );
        const uniqueResults = Array.from(
          new Map(filteredResults.map((r) => [r.videoId, r])).values(),
        );
        setSearchResults(uniqueResults);
        openSearch();
      } catch {
        setSearchError("Failed to search videos. Please try again.");
        openSearch();
      }
    },
    [
      query,
      clearSearch,
      openSearch,
      setSearchError,
      setSearchResults,
      startSearch,
    ],
  );

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl">
      <SearchIcon
        size={16}
        animate={isSearching}
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50"
      />
      <Input
        value={query}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search YouTube videos..."
        disabled={isSearching}
        className="h-10 rounded-xl border-white/10 bg-white/5 pl-9 pr-4 text-foreground placeholder:text-foreground/35 focus-visible:ring-0 focus-visible:bg-white/10"
      />
    </form>
  );
}

function V4TabsContentSearch() {
  const query = useYouTubeSearchStore((state) => state.query);
  const isSearching = useYouTubeSearchStore((state) => state.isSearching);
  const error = useYouTubeSearchStore((state) => state.error);
  const results = useYouTubeSearchStore((state) => state.results);

  const currentPlaylistId = usePlaylistStore((state) => state.currentPlaylistId);
  const currentTrackId = usePlaylistStore((state) => state.getCurrentTrack()?.id ?? null);
  const setCurrentPlaylist = usePlaylistStore((state) => state.setCurrentPlaylist);
  const setCurrentTrackIndex = usePlaylistStore((state) => state.setCurrentTrackIndex);

  const currentVideoId =
    currentPlaylistId === SEARCH_RESULTS_PLAYLIST_ID
      ? currentTrackId
      : null;

  const handleResultClick = (index: number) => {
    setCurrentPlaylist(SEARCH_RESULTS_PLAYLIST_ID);
    setCurrentTrackIndex(index);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <YouTubeSearchResultsSection
        query={query}
        isSearching={isSearching}
        error={error}
        results={results}
        currentVideoId={currentVideoId}
        onResultClick={handleResultClick}
        searchBar={<SearchBar />}
      />
    </div>
  );
}

function V4TabsContentIntentDetail() {
  return (
    <div className="mx-auto max-w-4xl">
      <IntentDetailSection />
      <div className="h-(--bottom-spacing) flex-none"></div>
    </div>
  );
}

function V4TabsContentPlaylistDetail() {
  return (
    <div className="mx-auto max-w-4xl">
      <PlaylistDetailSection />
      <div className="h-(--bottom-spacing) flex-none"></div>
    </div>
  );
}

const TAB_TO_COMPONENT: Record<V4TabWithDetail, React.ComponentType> = {
  intents: V4TabsContentPlaylists,
  channels: V4TabsContentChannels,
  "intent-detail": V4TabsContentIntentDetail,
  "playlist-detail": V4TabsContentPlaylistDetail,
  search: V4TabsContentSearch,
};

export function V4TabsContent() {
  const activeTab = useV4AppStateStore((state) => state.activeTab);

  const Component = TAB_TO_COMPONENT[activeTab];

  return (
    <div className="min-h-0 px-page">
      <AnimatePresence mode="wait" initial={false}>
        <Component />
      </AnimatePresence>
    </div>
  );
}
