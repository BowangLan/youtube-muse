import { createStore } from "zustand/vanilla";
import type {
  searchYouTubeUnofficial,
  SearchVideoResult,
} from "@/app/actions/youtube-search-unofficial";
import { SpotifyApiError, type searchSpotifyCatalog } from "@/lib/spotify/api";
import { catalogAuthorNames, catalogPrimaryImage } from "@/lib/types/catalog-search";
import type { Track } from "@/lib/types/playlist";
import { parseDuration } from "@/lib/utils/youtube";
import type { CatalogSearchResult, SearchActions, SearchQueue, SearchState } from "./types";

interface Dependencies {
  youtube: typeof searchYouTubeUnofficial;
  spotify: typeof searchSpotifyCatalog;
  getSpotifyToken: () => Promise<string | null>;
  queue: SearchQueue;
}

const emptyResults = () => ({
  isActive: false,
  isSearching: false,
  isLoadingMore: false,
  hasMore: false,
  nextOffset: 0,
  loadMoreError: null,
  error: null,
  results: [] as CatalogSearchResult[],
});

const initialState = (): SearchState => ({
  query: "",
  source: "youtube",
  youtubeDuration: "any",
  spotifyType: "all",
  ...emptyResults(),
});

function spotifyError(error: unknown) {
  if (!(error instanceof SpotifyApiError)) return "Failed to search Spotify. Please try again.";
  if (error.status === 429) return "Spotify's search limit was reached. Try again shortly.";
  if (error.status === 401) return "Your Spotify session expired. Reconnect and try again.";
  return `Spotify search failed (${error.status}). Please try again.`;
}

function normalizeYouTube(
  results: Awaited<ReturnType<Dependencies["youtube"]>>["results"],
): CatalogSearchResult[] {
  const videos = results.filter(
    (result): result is SearchVideoResult =>
      "videoId" in result && /^[a-zA-Z0-9_-]{11}$/.test(result.videoId),
  );
  return Array.from(new Map(videos.map((result) => [result.videoId, result])).values()).map(
    (result) => ({
      source: "youtube",
      resultType: "video",
      id: result.videoId,
      title: result.title,
      url: result.url,
      authors: [
        {
          id: result.channelId || null,
          name: result.channelTitle,
          url: result.channelId ? `https://www.youtube.com/channel/${result.channelId}` : null,
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
    }),
  );
}

function playableTrack(result: CatalogSearchResult, index: number): Track | null {
  if (result.source === "spotify" && result.resultType !== "track") return null;
  return {
    id: result.id,
    title: result.title,
    author: catalogAuthorNames(result.authors),
    authorUrl: result.authors[0]?.url ?? result.url,
    duration: result.source === "youtube" ? parseDuration(result.durationText) : result.duration,
    thumbnailUrl: catalogPrimaryImage(result.images) ?? "",
    addedAt: index,
    source: result.source,
    ...(result.source === "youtube" ? { publishedTimeText: result.publishedTimeText } : {}),
  };
}

/** All search entry points share request identity, results, and queue projection. */
export function createCatalogSearchSession(dependencies: Dependencies) {
  const { queue } = dependencies;
  let request: {
    criteria: Pick<SearchState, "query" | "source" | "spotifyType" | "youtubeDuration">;
    controller: AbortController;
  } | null = null;

  function invalidate() {
    request?.controller.abort();
    request = null;
  }

  function project(results: CatalogSearchResult[]) {
    const tracks = results.flatMap((result, index) => {
      const track = playableTrack(result, index);
      return track ? [track] : [];
    });
    const current = queue.current();
    if (
      current &&
      !tracks.some(
        (track) =>
          track.id === current.track.id && track.source === (current.track.source ?? "youtube"),
      )
    ) {
      // Keep playback anchored while discovery changes underneath it.
      tracks.splice(Math.min(current.index, tracks.length), 0, current.track);
    }
    queue.replace(tracks, store.getState().source);
  }

  function reset(patch: Partial<SearchState>) {
    invalidate();
    store.setState({ ...emptyResults(), ...patch });
    project([]);
  }

  async function execute(more: boolean): Promise<boolean> {
    const state = store.getState();
    if (more) {
      if (
        !request ||
        state.source !== "spotify" ||
        state.spotifyType === "all" ||
        state.isSearching ||
        state.isLoadingMore ||
        !state.hasMore
      )
        return false;
      store.setState({ isLoadingMore: true, loadMoreError: null });
    } else {
      const query = state.query.trim();
      if (!query) {
        reset(initialState());
        return false;
      }
      invalidate();
      request = {
        criteria: {
          query,
          source: state.source,
          spotifyType: state.spotifyType,
          youtubeDuration: state.youtubeDuration,
        },
        controller: new AbortController(),
      };
      store.setState({
        query,
        isActive: true,
        isSearching: true,
        isLoadingMore: false,
        hasMore: false,
        nextOffset: 0,
        loadMoreError: null,
        error: null,
      });
    }
    const active = request!;
    const { criteria, controller } = active;
    const current = () => request === active && !controller.signal.aborted;
    try {
      let results: CatalogSearchResult[];
      let hasMore = false;
      let nextOffset = 0;
      if (criteria.source === "spotify") {
        const token = await dependencies.getSpotifyToken();
        if (!current()) return false;
        if (!token) {
          const message = more
            ? "Spotify session expired. Reconnect to continue loading results."
            : "Connect Spotify to search its catalog.";
          if (more) store.setState({ isLoadingMore: false, loadMoreError: message });
          else fail(message);
          return true;
        }
        const page = await dependencies.spotify(
          token,
          criteria.query,
          criteria.spotifyType,
          more ? state.nextOffset : 0,
          controller.signal,
        );
        results = page.results;
        hasMore = page.hasMore;
        nextOffset = page.nextOffset;
      } else {
        const response = await dependencies.youtube(
          criteria.query,
          "video",
          criteria.youtubeDuration,
        );
        if (!current()) return false;
        if (response.error) {
          fail(response.error);
          return true;
        }
        results = normalizeYouTube(response.results);
      }
      if (!current()) return false;
      if (more) {
        const existing = store.getState().results;
        const ids = new Set(
          existing.map((result) => `${result.source}:${result.resultType}:${result.id}`),
        );
        results = [
          ...existing,
          ...results.filter((result) => {
            const id = `${result.source}:${result.resultType}:${result.id}`;
            if (ids.has(id)) return false;
            ids.add(id);
            return true;
          }),
        ];
      }
      // A provider page that cannot advance must not cause an infinite scroll loop.
      hasMore =
        criteria.source === "spotify" &&
        criteria.spotifyType !== "all" &&
        hasMore &&
        nextOffset > (more ? state.nextOffset : 0);
      project(results);
      store.setState({
        results,
        hasMore,
        nextOffset,
        isActive: true,
        isSearching: false,
        isLoadingMore: false,
        error: null,
        loadMoreError: null,
      });
      return true;
    } catch (error) {
      if (!current()) return false;
      const message =
        criteria.source === "spotify"
          ? spotifyError(error)
          : "Failed to search YouTube. Please try again.";
      if (more) store.setState({ isLoadingMore: false, loadMoreError: message });
      else fail(message);
      return true;
    }
  }

  function fail(error: string) {
    project([]);
    store.setState({ ...emptyResults(), isActive: true, error });
  }

  const store = createStore<SearchState & SearchActions>(() => ({
    ...initialState(),
    setQuery: (query) => {
      if (query === store.getState().query) return;
      invalidate();
      store.setState({ query, isSearching: false, isLoadingMore: false });
    },
    setSource: (source) =>
      reset({ source, ...(source === "spotify" ? { spotifyType: "all" } : {}) }),
    setYouTubeDuration: (youtubeDuration) => reset({ youtubeDuration }),
    setSpotifyType: async (spotifyType) => {
      reset({ spotifyType });
      if (!store.getState().query.trim()) return false;
      return execute(false);
    },
    search: () => execute(false),
    loadMore: async () => {
      await execute(true);
    },
    playResult: (index) => {
      const result = store.getState().results[index];
      const track = result && playableTrack(result, index);
      if (track) queue.play(track);
    },
    clearSearch: () => reset(initialState()),
  }));

  // Callers can observe state and issue intent, not complete arbitrary requests.
  return {
    getState: store.getState,
    getInitialState: store.getInitialState,
    subscribe: store.subscribe,
  };
}
