import { create } from "zustand"

export type YouTubeSearchVideoResult = {
  videoId: string
  title: string
  channelTitle: string
  channelId: string
  publishedTime: string
  viewCount: string
  lengthText: string
  thumbnail: string
  url: string
}

type YouTubeSearchState = {
  query: string
  isActive: boolean
  isSearching: boolean
  error: string | null
  results: YouTubeSearchVideoResult[]
}

type YouTubeSearchActions = {
  setQuery: (query: string) => void
  startSearch: (query: string) => void
  setResults: (results: YouTubeSearchVideoResult[]) => void
  setError: (error: string) => void
  clearSearch: () => void
}

const INITIAL_STATE: YouTubeSearchState = {
  query: "",
  isActive: false,
  isSearching: false,
  error: null,
  results: [],
}

export const SEARCH_RESULTS_PLAYLIST_ID = "youtube-search-results"

export const useYouTubeSearchStore = create<
  YouTubeSearchState & YouTubeSearchActions
>((set) => ({
  ...INITIAL_STATE,
  setQuery: (query) => set({ query }),
  startSearch: (query) =>
    set({
      query,
      isActive: true,
      isSearching: true,
      error: null,
    }),
  setResults: (results) =>
    set({
      isActive: true,
      isSearching: false,
      error: null,
      results,
    }),
  setError: (error) =>
    set({
      isActive: true,
      isSearching: false,
      error,
      results: [],
    }),
  clearSearch: () => set({ ...INITIAL_STATE }),
}))
