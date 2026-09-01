import type { YouTubeSearchVideoRenderer } from "@/app/actions/youtube-search-unofficial";
import type { SpotifySearchFilter, SpotifySearchResult } from "@/lib/spotify/api";
import type { CatalogSearchResultBase } from "@/lib/types/catalog-search";
import type { Track } from "@/lib/types/playlist";

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

export interface SearchState {
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
}

export interface SearchActions {
  setQuery: (query: string) => void;
  setSource: (source: SearchSource) => void;
  setYouTubeDuration: (duration: YouTubeDurationFilter) => void;
  setSpotifyType: (type: SpotifySearchFilter) => Promise<boolean>;
  /** True when this submission settled; false when empty or superseded. */
  search: () => Promise<boolean>;
  loadMore: () => Promise<void>;
  playResult: (index: number) => void;
  clearSearch: () => void;
}

/** Playlist persistence and ordering stay outside discovery policy. */
export interface SearchQueue {
  current: () => { track: Track; index: number } | null;
  replace: (tracks: Track[], source: SearchSource) => void;
  play: (track: Track) => void;
}

export const SEARCH_RESULTS_PLAYLIST_ID = "catalog-search-results";
