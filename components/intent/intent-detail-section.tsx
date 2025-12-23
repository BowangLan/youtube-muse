"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TrackItemSmall } from "@/components/playlist/track-item-small";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStateStore } from "@/lib/store/app-state-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { INTENTS, buildIntentQuery, getIntentByName } from "@/lib/intents";
import { searchYouTubeVideos } from "@/app/actions/youtube-search";
import { motion } from "motion/react";
import { EASING_DURATION_CARD, EASING_EASE_OUT } from "@/lib/styles/animation";

export function IntentDetailSection() {
  const activePlaylistId = useAppStateStore((state) => state.activePlaylistId);
  const setView = useAppStateStore((state) => state.setView);

  const playlists = usePlaylistStore((state) => state.playlists);
  const currentPlaylistId = usePlaylistStore(
    (state) => state.currentPlaylistId
  );
  const currentTrackIndex = usePlaylistStore(
    (state) => state.currentTrackIndex
  );
  const isShuffleEnabled = usePlaylistStore((state) => state.isShuffleEnabled);
  const shuffleOrder = usePlaylistStore((state) => state.shuffleOrder);
  const setCurrentTrackIndex = usePlaylistStore(
    (state) => state.setCurrentTrackIndex
  );
  const addTrackToPlaylist = usePlaylistStore(
    (state) => state.addTrackToPlaylist
  );

  const togglePlay = usePlayerStore((state) => state.togglePlay);

  const [isAdding, setIsAdding] = React.useState(false);

  // Derive active playlist from stores
  const activePlaylist = React.useMemo(() => {
    if (!activePlaylistId) return undefined;
    return playlists.find((p) => p.id === activePlaylistId);
  }, [activePlaylistId, playlists]);

  // Derive active intent from playlist name
  const activeIntent = React.useMemo(
    () => getIntentByName(activePlaylist?.name),
    [activePlaylist?.name]
  );

  // Calculate actual track index considering shuffle
  const currentActualTrackIndex =
    isShuffleEnabled && shuffleOrder.length > 0
      ? shuffleOrder[currentTrackIndex] ?? currentTrackIndex
      : currentTrackIndex;

  const intentGradient = activeIntent?.gradientClassName ?? undefined;

  const handleTrackClick = React.useCallback(
    (index: number) => {
      if (!currentPlaylistId) return;
      if (currentActualTrackIndex === index) {
        togglePlay();
      } else {
        setCurrentTrackIndex(index);
      }
    },
    [
      currentPlaylistId,
      currentActualTrackIndex,
      togglePlay,
      setCurrentTrackIndex,
    ]
  );

  const handleAddToIntent = React.useCallback(async () => {
    if (!activePlaylistId || !activePlaylist) return;

    const intent = INTENTS.find((i) => i.name === activePlaylist.name);
    if (!intent) return;

    setIsAdding(true);
    try {
      const { results } = await searchYouTubeVideos(buildIntentQuery(intent));
      const existing = new Set(activePlaylist.tracks.map((t) => t.id));
      const next = results.find((r) => r?.id && !existing.has(r.id));
      if (!next) return;

      const thumb =
        next.thumbnail?.thumbnails?.[next.thumbnail.thumbnails.length - 1]
          ?.url ?? `https://i.ytimg.com/vi/${next.id}/hqdefault.jpg`;

      addTrackToPlaylist(activePlaylistId, {
        id: next.id,
        title: next.title,
        author: next.channelTitle,
        authorUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(
          next.channelTitle
        )}`,
        duration: 0,
        thumbnailUrl: thumb,
      });
    } finally {
      setIsAdding(false);
    }
  }, [activePlaylist, activePlaylistId, addTrackToPlaylist]);

  if (!activePlaylist) return null;

  return (
    <motion.section
      aria-label={`Intent - ${activePlaylist.name}`}
      className="space-y-6 md:space-y-8"
      layoutId={`intent-detail-section-${activePlaylist.id}`}
      layout
      transition={{ duration: EASING_DURATION_CARD, ease: EASING_EASE_OUT }}
    >
      <div
        className={cn(
          "relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/3 p-2 md:p-3",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-linear-to-br before:opacity-90",
          "h-[60vh] overflow-y-auto",
          intentGradient
        )}
      >
        <div className="flex items-center justify-between gap-3 relative w-full">
          <Button
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setView("grid");
            }}
            size="icon"
          >
            <ArrowLeft className="h-4 w-4" />
            {/* <span className="text-sm">Back</span> */}
          </Button>

          {/* Center */}
          <div className="absolute inset-0 flex h-full flex-col items-center justify-center pointer-events-none select-none gap-1">
            <motion.div
              className="text-base/tight md:text-lg/tight font-normal text-white"
              layout="position"
              layoutId={`intent-name-${activePlaylist.id}`}
              transition={{
                duration: EASING_DURATION_CARD,
                ease: EASING_EASE_OUT,
              }}
            >
              {activePlaylist.name}
            </motion.div>
            <div className="text-xs/tight md:text-sm/tight font-normal text-white/60 tracking-wide">
              {activePlaylist.tracks.length.toLocaleString()} tracks
            </div>
          </div>

          <Button
            onClick={handleAddToIntent}
            disabled={isAdding || !activePlaylistId}
            variant="ghost"
            size="icon"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {/* <span className="text-sm">{isAdding ? "Adding…" : "Add"}</span> */}
          </Button>
        </div>

        <div className="space-y-1 mt-4 mb-2 px-4">
          {activePlaylist.tracks.map((track, index) => (
            <TrackItemSmall
              key={`${track.id}-${track.addedAt}`}
              track={track}
              isCurrentTrack={currentActualTrackIndex === index}
              onClick={() => handleTrackClick(index)}
              // Deliberately unused: no editing/removal in this UX
              onRemove={() => {}}
              align="left"
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
