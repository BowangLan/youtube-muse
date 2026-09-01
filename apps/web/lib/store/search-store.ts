import { useStore } from "zustand";
import { searchYouTubeUnofficial } from "@/app/actions/youtube-search-unofficial";
import { searchSpotifyCatalog } from "@/lib/spotify/api";
import { createCatalogSearchSession } from "@/lib/catalog-search/session";
import { SEARCH_RESULTS_PLAYLIST_ID } from "@/lib/catalog-search/types";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useSpotifyStore } from "@/lib/store/spotify-store";

export { SEARCH_RESULTS_PLAYLIST_ID } from "@/lib/catalog-search/types";
export type {
  SearchSource,
  YouTubeDurationFilter,
  CatalogSearchResult,
  YouTubeSearchVideoResult,
} from "@/lib/catalog-search/types";

const session = createCatalogSearchSession({
  youtube: searchYouTubeUnofficial,
  spotify: searchSpotifyCatalog,
  getSpotifyToken: () => useSpotifyStore.getState().getValidAccessToken(),
  queue: {
    current: () => {
      const state = usePlaylistStore.getState();
      const track =
        state.currentPlaylistId === SEARCH_RESULTS_PLAYLIST_ID ? state.getCurrentTrack() : null;
      const index =
        state.isShuffleEnabled && state.shuffleOrder.length > 0
          ? (state.shuffleOrder[state.currentTrackIndex] ?? state.currentTrackIndex)
          : state.currentTrackIndex;
      return track ? { track, index } : null;
    },
    replace: (tracks, source) => {
      const state = usePlaylistStore.getState();
      state.ensurePlaylist(
        SEARCH_RESULTS_PLAYLIST_ID,
        "Search Results",
        `${source === "spotify" ? "Spotify" : "YouTube"} search results`,
        tracks,
      );
      state.setPlaylistTracks(SEARCH_RESULTS_PLAYLIST_ID, tracks);
    },
    play: (track) => {
      const state = usePlaylistStore.getState();
      const playlist = state.playlists.find((item) => item.id === SEARCH_RESULTS_PLAYLIST_ID);
      const index =
        playlist?.tracks.findIndex(
          (item) => item.id === track.id && (item.source ?? "youtube") === track.source,
        ) ?? -1;
      if (index < 0) return;
      state.setCurrentPlaylist(SEARCH_RESULTS_PLAYLIST_ID);
      state.setCurrentTrackIndex(index);
    },
  },
});

export const useSearchStore = <T>(selector: (state: ReturnType<typeof session.getState>) => T) =>
  useStore(session, selector);
