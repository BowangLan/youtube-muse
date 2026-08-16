import { create } from "zustand";
import type { YouTubeSearchVideoRenderer } from "@/app/actions/youtube-search-unofficial";
import type { SpotifySearchFilter, SpotifySearchResult } from "@/lib/spotify/api";
import type { CatalogSearchResultBase } from "@/lib/types/catalog-search";

export type SearchSource = "youtube" | "spotify";
export type YouTubeDurationFilter = "any" | "short" | "long";

export interface YouTubeSearchVideoResult extends CatalogSearchResultBase<
  "youtube",
  "video",
  YouTubeSearchVideoRenderer
> {
  publishedTimeText: string;
  viewCountText: string;
  durationText: string;
}

export type CatalogSearchResult = YouTubeSearchVideoResult | SpotifySearchResult;

type SearchState = {
  query: string;
  source: SearchSource;
  youtubeDuration: YouTubeDurationFilter;
  spotifyType: SpotifySearchFilter;
  isActive: boolean;
  isSearching: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  nextOffset: number;
  loadMoreError: string | null;
  error: string | null;
  results: CatalogSearchResult[];
};

type SearchActions = {
  setQuery: (query: string) => void;
  setSource: (source: SearchSource) => void;
  setYouTubeDuration: (duration: YouTubeDurationFilter) => void;
  setSpotifyType: (type: SpotifySearchFilter) => void;
  startSearch: (query: string) => void;
  setResults: (
    results: CatalogSearchResult[],
    pagination?: { hasMore: boolean; nextOffset: number },
  ) => void;
  startLoadingMore: () => void;
  appendResults: (
    results: CatalogSearchResult[],
    pagination: { hasMore: boolean; nextOffset: number },
  ) => void;
  setLoadMoreError: (error: string) => void;
  setError: (error: string) => void;
  clearSearch: () => void;
};

const INITIAL_STATE: SearchState = {
  query: "",
  source: "youtube",
  youtubeDuration: "any",
  spotifyType: "all",
  isActive: false,
  isSearching: false,
  isLoadingMore: false,
  hasMore: false,
  nextOffset: 0,
  loadMoreError: null,
  error: null,
  results: [],
};

const clearResultState = (): Pick<
  SearchState,
  | "isActive"
  | "isSearching"
  | "isLoadingMore"
  | "hasMore"
  | "nextOffset"
  | "loadMoreError"
  | "error"
  | "results"
> => ({
  isActive: false,
  isSearching: false,
  isLoadingMore: false,
  hasMore: false,
  nextOffset: 0,
  loadMoreError: null,
  error: null,
  results: [],
});

export const SEARCH_RESULTS_PLAYLIST_ID = "catalog-search-results";

export const useSearchStore = create<SearchState & SearchActions>((set) => ({
  ...INITIAL_STATE,
  setQuery: (query) => set({ query }),
  setSource: (source) =>
    set({
      source,
      ...(source === "spotify" ? { spotifyType: "all" as const } : {}),
      ...clearResultState(),
    }),
  setYouTubeDuration: (youtubeDuration) => set({ youtubeDuration, ...clearResultState() }),
  setSpotifyType: (spotifyType) => set({ spotifyType, ...clearResultState() }),
  startSearch: (query) =>
    set({
      query,
      isActive: true,
      isSearching: true,
      isLoadingMore: false,
      hasMore: false,
      nextOffset: 0,
      loadMoreError: null,
      error: null,
    }),
  setResults: (results, pagination) =>
    set({
      isActive: true,
      isSearching: false,
      error: null,
      results,
      hasMore: pagination?.hasMore ?? false,
      nextOffset: pagination?.nextOffset ?? 0,
      isLoadingMore: false,
      loadMoreError: null,
    }),
  startLoadingMore: () => set({ isLoadingMore: true, loadMoreError: null }),
  appendResults: (results, pagination) =>
    set((state) => {
      const existingIds = new Set(
        state.results.map((result) => `${result.source}:${result.resultType}:${result.id}`),
      );
      const uniqueResults = results.filter((result) => {
        const id = `${result.source}:${result.resultType}:${result.id}`;
        if (existingIds.has(id)) return false;
        existingIds.add(id);
        return true;
      });
      return {
        results: [...state.results, ...uniqueResults],
        hasMore: pagination.hasMore,
        nextOffset: pagination.nextOffset,
        isLoadingMore: false,
        loadMoreError: null,
      };
    }),
  setLoadMoreError: (loadMoreError) => set({ isLoadingMore: false, loadMoreError }),
  setError: (error) =>
    set({
      isActive: true,
      isSearching: false,
      isLoadingMore: false,
      hasMore: false,
      nextOffset: 0,
      loadMoreError: null,
      error,
      results: [],
    }),
  clearSearch: () => set({ ...INITIAL_STATE }),
}));
