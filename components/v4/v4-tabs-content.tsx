import { useV4AppStateStore, V4Tab } from "@/lib/store/v4-app-state-store";
import { AnimatePresence } from "motion/react";
import { IntentGridSection } from "../intent/intent-grid-section";
import { IntentDetailSection } from "../intent/intent-detail-section";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { useMemo } from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { LatestVideosGrid } from "./tabs/latest-videos-grid";
import { V4TabContentHeader } from "./v4-tab-content-header";
import { YouTubeSearchResultsSection } from "../search/youtube-search-results-section";
import {
  SEARCH_RESULTS_PLAYLIST_ID,
  useYouTubeSearchStore,
} from "@/lib/store/youtube-search-store";

function V4TabsContentIntents() {
  const intents = useCustomIntentsStore(
    (state) => state.intentPlaylistOrder
  );
  const playlists = usePlaylistStore((state) => state.playlists);

  const intentPlaylists = useMemo(() => {
    return intents.map((playlistId) => playlists.find((playlist) => playlist.id === playlistId)).filter((playlist) => playlist !== undefined);
  }, [intents, playlists]);


  return (
    <div className="mx-auto max-w-6xl sm:my-8">
      <V4TabContentHeader title="Latest Videos" />
      <IntentGridSection intentPlaylists={intentPlaylists} />
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
    <div className="mx-auto max-w-6xl sm:my-8">
      <YouTubeSearchResultsSection
        query={query}
        isSearching={isSearching}
        error={error}
        results={results}
        currentVideoId={currentVideoId}
        onResultClick={handleResultClick}
      />
    </div>
  );
}

const TAB_TO_COMPONENT: Record<V4Tab, React.ComponentType> = {
  intents: V4TabsContentIntents,
  channels: V4TabsContentChannels,
  "intent-detail": IntentDetailSection,
  search: V4TabsContentSearch,
};

export function V4TabsContent() {
  const activeTab = useV4AppStateStore((state) => state.activeTab);

  const Component = TAB_TO_COMPONENT[activeTab];

  return (
    <div className="min-h-0 px-page py-8">
      <AnimatePresence mode="wait" initial={false}>
        <Component />
      </AnimatePresence>
    </div>
  );
}
