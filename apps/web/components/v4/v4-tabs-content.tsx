import { useV4AppStateStore, V4TabWithDetail } from "@/lib/store/v4-app-state-store";
import { AnimatePresence, motion } from "motion/react";
import { IntentDetailSection } from "../intent/intent-detail-section";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { useCustomPlaylistsStore } from "@/lib/store/custom-playlists-store";
import { useCallback, useMemo } from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { LatestVideosGrid } from "./tabs/latest-videos-grid";
import { V4TabContentHeader } from "./v4-tab-content-header";
import { CatalogSearchResultsSection } from "../search/catalog-search-results-section";
import {
  SEARCH_RESULTS_PLAYLIST_ID,
  type SearchSource,
  type YouTubeDurationFilter,
  useSearchStore,
} from "@/lib/store/search-store";
import { PlaylistCardGrid } from "../playlist/playlist-card-grid";
import { PlaylistDetailSection } from "../playlist/playlist-detail-section";
import {
  searchYouTubeUnofficial,
  type SearchVideoResult,
} from "@/app/actions/youtube-search-unofficial";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "@/components/ui/search";
import { SpotifyFavoritesSection } from "../spotify/spotify-favorites-section";
import { SpotifyLogo } from "../spotify/spotify-logo";
import { Button } from "@/components/ui/button";
import { Youtube } from "lucide-react";
import {
  searchSpotifyCatalog,
  SpotifyApiError,
  type SpotifySearchFilter,
  type SpotifySearchType,
} from "@/lib/spotify/api";
import { useSpotifyStore } from "@/lib/store/spotify-store";
import { isSpotifyConfigured, redirectToSpotifyAuthorize } from "@/lib/spotify/auth";
import { cn } from "@/lib/utils";

function spotifySearchErrorMessage(error: unknown) {
  if (!(error instanceof SpotifyApiError)) return "Failed to search Spotify. Please try again.";
  if (error.status === 429) return "Spotify's search limit was reached. Try again shortly.";
  if (error.status === 401) return "Your Spotify session expired. Reconnect and try again.";
  return `Spotify search failed (${error.status}). Please try again.`;
}

function V4TabsContentPlaylists() {
  const intents = useCustomIntentsStore((state) => state.intentPlaylistOrder);
  const customPlaylistIds = useCustomPlaylistsStore((state) => state.customPlaylistIds);
  const playlists = usePlaylistStore((state) => state.playlists);

  const intentPlaylists = useMemo(() => {
    return intents
      .map((playlistId) => playlists.find((playlist) => playlist.id === playlistId))
      .filter((playlist) => playlist !== undefined);
  }, [intents, playlists]);

  const customPlaylists = useMemo(() => {
    const intentIds = new Set(intentPlaylists.map((playlist) => playlist.id));
    return customPlaylistIds
      .map((playlistId) => playlists.find((playlist) => playlist.id === playlistId))
      .filter(
        (playlist): playlist is NonNullable<typeof playlist> =>
          playlist !== undefined && !intentIds.has(playlist.id),
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

function V4TabsContentSpotify() {
  return (
    <div className="mx-auto max-w-6xl">
      <SpotifyFavoritesSection />
      <div className="h-(--bottom-spacing) flex-none"></div>
    </div>
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
  const query = useSearchStore((state) => state.query);
  const source = useSearchStore((state) => state.source);
  const youtubeDuration = useSearchStore((state) => state.youtubeDuration);
  const spotifyType = useSearchStore((state) => state.spotifyType);
  const isSearching = useSearchStore((state) => state.isSearching);
  const setSearchQuery = useSearchStore((state) => state.setQuery);
  const setSource = useSearchStore((state) => state.setSource);
  const setYouTubeDuration = useSearchStore((state) => state.setYouTubeDuration);
  const setSpotifyType = useSearchStore((state) => state.setSpotifyType);
  const startSearch = useSearchStore((state) => state.startSearch);
  const setSearchResults = useSearchStore((state) => state.setResults);
  const setSearchError = useSearchStore((state) => state.setError);
  const clearSearch = useSearchStore((state) => state.clearSearch);
  const getValidSpotifyAccessToken = useSpotifyStore((state) => state.getValidAccessToken);
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
        if (source === "spotify") {
          const accessToken = await getValidSpotifyAccessToken();
          if (!accessToken) {
            setSearchError("Connect Spotify to search its catalog.");
            openSearch();
            return;
          }
          const page = await searchSpotifyCatalog(accessToken, normalizedQuery, spotifyType);
          setSearchResults(page.results, page);
          openSearch();
          return;
        }

        const { results, error } = await searchYouTubeUnofficial(
          normalizedQuery,
          "video",
          youtubeDuration,
        );
        if (error) {
          setSearchError(error);
          return;
        }
        const videoResults = results.filter((r): r is SearchVideoResult => "videoId" in r);
        const filteredResults = videoResults.filter((r) => /^[a-zA-Z0-9_-]{11}$/.test(r.videoId));
        const uniqueResults = Array.from(
          new Map(filteredResults.map((r) => [r.videoId, r])).values(),
        );
        setSearchResults(
          uniqueResults.map((result) => ({
            source: "youtube" as const,
            resultType: "video" as const,
            id: result.videoId,
            title: result.title,
            url: result.url,
            authors: [
              {
                id: result.channelId || null,
                name: result.channelTitle,
                url: result.channelId
                  ? `https://www.youtube.com/channel/${result.channelId}`
                  : null,
                images: [],
                raw: result.raw.ownerText?.runs?.[0] ?? null,
              },
            ],
            images: result.raw.thumbnail.thumbnails.map((image) => ({
              url: image.url.startsWith("//") ? `https:${image.url}` : image.url,
              width: image.width,
              height: image.height,
            })),
            raw: result.raw,
            publishedTimeText: result.publishedTime,
            viewCountText: result.viewCount,
            durationText: result.lengthText,
          })),
        );
        openSearch();
      } catch (error) {
        setSearchError(
          source === "spotify"
            ? spotifySearchErrorMessage(error)
            : "Failed to search YouTube. Please try again.",
        );
        openSearch();
      }
    },
    [
      query,
      source,
      spotifyType,
      youtubeDuration,
      clearSearch,
      getValidSpotifyAccessToken,
      openSearch,
      setSearchError,
      setSearchResults,
      startSearch,
    ],
  );

  const sourceOptions: Array<{ value: SearchSource; label: string; icon: React.ReactNode }> = [
    { value: "youtube", label: "YouTube", icon: <Youtube className="size-3.5" /> },
    { value: "spotify", label: "Spotify", icon: <SpotifyLogo className="size-3.5" /> },
  ];
  const youtubeFilters: Array<{ value: YouTubeDurationFilter; label: string }> = [
    { value: "any", label: "Any length" },
    { value: "short", label: "Under 4 min" },
    { value: "long", label: "Over 20 min" },
  ];
  const spotifyFilters: Array<{ value: SpotifySearchFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "track", label: "Tracks" },
    { value: "album", label: "Albums" },
    { value: "artist", label: "Artists" },
    { value: "playlist", label: "Playlists" },
  ];

  const handleSpotifyFilterChange = useCallback(
    async (filter: SpotifySearchFilter) => {
      setSpotifyType(filter);
      const normalizedQuery = query.trim();
      if (!normalizedQuery) return;
      startSearch(normalizedQuery);
      try {
        const accessToken = await getValidSpotifyAccessToken();
        if (!accessToken) {
          setSearchError("Connect Spotify to search its catalog.");
          return;
        }
        const page = await searchSpotifyCatalog(accessToken, normalizedQuery, filter);
        setSearchResults(page.results, page);
      } catch (error) {
        setSearchError(spotifySearchErrorMessage(error));
      }
    },
    [
      getValidSpotifyAccessToken,
      query,
      setSearchError,
      setSearchResults,
      setSpotifyType,
      startSearch,
    ],
  );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl space-y-3">
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <SearchIcon
            size={16}
            animate={isSearching}
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50"
          />
          <Input
            value={query}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${source === "spotify" ? "Spotify" : "YouTube"}...`}
            disabled={isSearching}
            aria-label={`Search ${source === "spotify" ? "Spotify" : "YouTube"}`}
            className="h-10 rounded-xl border-white/10 bg-white/5 pl-9 pr-4 text-foreground placeholder:text-foreground/35 focus-visible:bg-white/10 focus-visible:ring-0"
          />
        </div>
        <Button
          type="submit"
          disabled={isSearching || !query.trim()}
          className={cn(
            "h-10 rounded-xl border border-white/10 bg-white/10 px-4 text-foreground hover:bg-white/15",
            source === "spotify" && "border-[#1DB954]/20 bg-[#1DB954]/15 hover:bg-[#1DB954]/20",
          )}
        >
          Search
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex w-fit rounded-full border border-white/10 bg-black/15 p-0.5"
          aria-label="Search source"
        >
          {sourceOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={source === option.value}
              onClick={() => setSource(option.value)}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-full px-3 text-xs text-white/45 transition-colors hover:text-white/75",
                source === option.value &&
                  (option.value === "spotify"
                    ? "bg-[#1DB954]/15 text-[#6ee79a]"
                    : "bg-white/10 text-white/90"),
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 overflow-x-auto pb-0.5" aria-label="Search filters">
          {(source === "youtube" ? youtubeFilters : spotifyFilters).map((filter) => {
            const selected =
              source === "youtube"
                ? youtubeDuration === filter.value
                : spotifyType === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  if (source === "youtube") {
                    setYouTubeDuration(filter.value as YouTubeDurationFilter);
                  } else {
                    void handleSpotifyFilterChange(filter.value as SpotifySearchFilter);
                  }
                }}
                className={cn(
                  "h-7 shrink-0 rounded-full border border-transparent px-2.5 text-[11px] text-white/40 transition-colors hover:text-white/70",
                  selected && "border-white/10 bg-white/[0.07] text-white/80",
                )}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>
    </form>
  );
}

function V4TabsContentSearch() {
  const query = useSearchStore((state) => state.query);
  const source = useSearchStore((state) => state.source);
  const isSearching = useSearchStore((state) => state.isSearching);
  const error = useSearchStore((state) => state.error);
  const results = useSearchStore((state) => state.results);
  const spotifyType = useSearchStore((state) => state.spotifyType);
  const setSpotifyType = useSearchStore((state) => state.setSpotifyType);
  const startSearch = useSearchStore((state) => state.startSearch);
  const setSearchResults = useSearchStore((state) => state.setResults);
  const isLoadingMore = useSearchStore((state) => state.isLoadingMore);
  const hasMore = useSearchStore((state) => state.hasMore);
  const nextOffset = useSearchStore((state) => state.nextOffset);
  const loadMoreError = useSearchStore((state) => state.loadMoreError);
  const startLoadingMore = useSearchStore((state) => state.startLoadingMore);
  const appendResults = useSearchStore((state) => state.appendResults);
  const setLoadMoreError = useSearchStore((state) => state.setLoadMoreError);
  const setSearchError = useSearchStore((state) => state.setError);
  const spotifyTokens = useSpotifyStore((state) => state.tokens);
  const getValidSpotifyAccessToken = useSpotifyStore((state) => state.getValidAccessToken);

  const currentPlaylistId = usePlaylistStore((state) => state.currentPlaylistId);
  const currentTrackId = usePlaylistStore((state) => state.getCurrentTrack()?.id ?? null);
  const setCurrentPlaylist = usePlaylistStore((state) => state.setCurrentPlaylist);
  const setCurrentTrackIndex = usePlaylistStore((state) => state.setCurrentTrackIndex);

  const currentResultId = currentPlaylistId === SEARCH_RESULTS_PLAYLIST_ID ? currentTrackId : null;

  const handleResultClick = (index: number) => {
    setCurrentPlaylist(SEARCH_RESULTS_PLAYLIST_ID);
    setCurrentTrackIndex(index);
  };

  const handleSpotifySectionMore = useCallback(
    async (type: SpotifySearchType) => {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) return;
      setSpotifyType(type);
      startSearch(normalizedQuery);
      try {
        const accessToken = await getValidSpotifyAccessToken();
        if (!accessToken) {
          setSearchError("Connect Spotify to search its catalog.");
          return;
        }
        const page = await searchSpotifyCatalog(accessToken, normalizedQuery, type);
        setSearchResults(page.results, page);
      } catch (error) {
        setSearchError(spotifySearchErrorMessage(error));
      }
    },
    [
      getValidSpotifyAccessToken,
      query,
      setSearchError,
      setSearchResults,
      setSpotifyType,
      startSearch,
    ],
  );

  const handleLoadMore = useCallback(async () => {
    const normalizedQuery = query.trim();
    if (
      source !== "spotify" ||
      spotifyType === "all" ||
      !normalizedQuery ||
      isSearching ||
      isLoadingMore ||
      !hasMore
    ) {
      return;
    }

    startLoadingMore();
    try {
      const accessToken = await getValidSpotifyAccessToken();
      if (!accessToken) {
        setLoadMoreError("Spotify session expired. Reconnect to continue loading results.");
        return;
      }
      const page = await searchSpotifyCatalog(
        accessToken,
        normalizedQuery,
        spotifyType,
        nextOffset,
      );
      const currentSearch = useSearchStore.getState();
      if (
        currentSearch.source !== "spotify" ||
        currentSearch.spotifyType !== spotifyType ||
        currentSearch.isSearching
      ) {
        return;
      }
      appendResults(page.results, page);
    } catch (error) {
      setLoadMoreError(spotifySearchErrorMessage(error));
    }
  }, [
    appendResults,
    getValidSpotifyAccessToken,
    hasMore,
    isLoadingMore,
    isSearching,
    nextOffset,
    query,
    setLoadMoreError,
    source,
    spotifyType,
    startLoadingMore,
  ]);

  return (
    <div className="mx-auto max-w-6xl">
      <CatalogSearchResultsSection
        query={query}
        source={source}
        spotifyType={spotifyType}
        isSearching={isSearching}
        error={error}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        loadMoreError={loadMoreError}
        results={results}
        currentResultId={currentResultId}
        onResultClick={handleResultClick}
        onSpotifySectionMore={(type) => void handleSpotifySectionMore(type)}
        onLoadMore={() => void handleLoadMore()}
        searchBar={<SearchBar />}
        emptyState={
          source === "spotify" && !spotifyTokens ? (
            <div className="relative flex h-[42vh] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-[#1DB954]/15 bg-white/[0.035] px-6 text-center">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(29,185,84,0.12),transparent_46%)]" />
              <SpotifyLogo className="relative size-9 text-[#1DB954]" />
              <div className="relative space-y-1">
                <p className="text-sm font-medium text-foreground">Connect Spotify to search</p>
                <p className="text-xs text-muted-foreground">
                  Search tracks, albums, artists, and playlists.
                </p>
              </div>
              {isSpotifyConfigured() && (
                <Button
                  className="relative h-10 rounded-full bg-[#1DB954] px-5 font-medium text-black hover:bg-[#1ed760]"
                  onClick={() => void redirectToSpotifyAuthorize()}
                >
                  Connect Spotify
                </Button>
              )}
            </div>
          ) : undefined
        }
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
  spotify: V4TabsContentSpotify,
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
