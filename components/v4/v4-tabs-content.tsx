import { useV4AppStateStore, V4Tab } from "@/lib/store/v4-app-state-store";
import { AnimatePresence } from "motion/react";
import { IntentGridSection } from "../intent/intent-grid-section";
import { IntentDetailSection } from "../intent/intent-detail-section";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import { useMemo } from "react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { LatestVideosGrid } from "./tabs/latest-videos-grid";
import { V4TabContentHeader } from "./v4-tab-content-header";

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

const TAB_TO_COMPONENT: Record<V4Tab, React.ComponentType> = {
  intents: V4TabsContentIntents,
  channels: V4TabsContentChannels,
  "intent-detail": IntentDetailSection,
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