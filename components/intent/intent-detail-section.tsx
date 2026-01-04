"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getThumbnailUrl, parseDuration } from "@/lib/utils/youtube";
import { TrackItemSmall } from "@/components/playlist/track-item-small";
import {
  ArrowLeft,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Shuffle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStateStore } from "@/lib/store/app-state-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { useCustomIntentsStore } from "@/lib/store/custom-intents-store";
import {
  buildCustomIntentQuery,
  getIntentByName,
  getRandomGradient,
} from "@/lib/intents";
import { searchYouTubeVideos } from "@/app/actions/youtube-search";
import { motion } from "motion/react";
import { EASING_DURATION_CARD, EASING_EASE_OUT } from "@/lib/styles/animation";
import { EditIntentDialog } from "./edit-intent-dialog";

export function IntentDetailSection() {
  const activePlaylistId = useAppStateStore((state) => state.activePlaylistId);
  const returnToGrid = useAppStateStore((state) => state.returnToGrid);

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
  const setCurrentPlaylist = usePlaylistStore(
    (state) => state.setCurrentPlaylist
  );
  const addTrackToPlaylist = usePlaylistStore(
    (state) => state.addTrackToPlaylist
  );
  const removeTrackFromPlaylist = usePlaylistStore(
    (state) => state.removeTrackFromPlaylist
  );

  const dispatch = usePlayerStore((state) => state.dispatch);

  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);
  const updatePlaylist = usePlaylistStore((state) => state.updatePlaylist);

  const gradientOverrides = useCustomIntentsStore(
    (state) => state.gradientOverrides
  );
  const setGradientOverride = useCustomIntentsStore(
    (state) => state.setGradientOverride
  );

  const [isAdding, setIsAdding] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  // Derive active playlist from stores
  const activePlaylist = React.useMemo(() => {
    if (!activePlaylistId) return undefined;
    return playlists.find((p) => p.id === activePlaylistId);
  }, [activePlaylistId, playlists]);

  // Derive active intent from playlist name
  const activeIntent = React.useMemo(() => {
    return getIntentByName(activePlaylist?.name);
  }, [activePlaylist?.name]);

  // Calculate actual track index considering shuffle
  const currentActualTrackIndex =
    isShuffleEnabled && shuffleOrder.length > 0
      ? (shuffleOrder[currentTrackIndex] ?? currentTrackIndex)
      : currentTrackIndex;

  // Get gradient (check for overrides first, then fall back to intent default)
  const intentGradient = React.useMemo(() => {
    if (!activePlaylistId) return activeIntent?.gradientClassName;
    return (
      gradientOverrides[activePlaylistId] ?? activeIntent?.gradientClassName
    );
  }, [activePlaylistId, gradientOverrides, activeIntent?.gradientClassName]);

  // Get minimum duration
  const minDuration = 20;

  const handleTrackClick = React.useCallback(
    (index: number) => {
      if (!activePlaylistId) return;

      // If viewing a different playlist than the one currently playing, switch to it
      if (currentPlaylistId !== activePlaylistId) {
        setCurrentPlaylist(activePlaylistId);
        // setCurrentPlaylist resets to index 0, so we need to set the correct index
        setCurrentTrackIndex(index);
      } else if (currentActualTrackIndex === index) {
        dispatch({ type: "UserTogglePlay" });
      } else {
        setCurrentTrackIndex(index);
      }
    },
    [
      activePlaylistId,
      currentPlaylistId,
      currentActualTrackIndex,
      dispatch,
      setCurrentPlaylist,
      setCurrentTrackIndex,
    ]
  );

  const handleAddToIntent = React.useCallback(async () => {
    if (!activePlaylistId || !activePlaylist || !activeIntent) return;

    setIsAdding(true);
    try {
      const query = buildCustomIntentQuery([...activeIntent.keywords]);

      if (
        typeof window !== "undefined" &&
        window.umami &&
        process.env.NODE_ENV === "production"
      ) {
        window.umami.track("youtube-api-search-videos", {
          context: "intent-add-track",
          intent: activePlaylist.name,
        });
      }
      const { results } = await searchYouTubeVideos(query, "video", {
        minDurationMinutes: minDuration,
        order: "relevance",
      });
      const existing = new Set(activePlaylist.tracks.map((t) => t.id));
      const next = results.find((r) => r?.id && !existing.has(r.id));
      if (!next) return;

      const thumb = getThumbnailUrl(next.id, "hqdefault");

      addTrackToPlaylist(activePlaylistId, {
        id: next.id,
        title: next.title,
        author: next.channelTitle,
        authorUrl: `https://www.youtube.com/channel/${next.channelId || ""}`,
        authorThumbnail: next.channelThumbnail,
        duration: next.length?.simpleText
          ? parseDuration(next.length.simpleText)
          : 0,
        thumbnailUrl: thumb,
        publishedAt: next.publishedAt,
        publishedTimeText: next.publishedTimeText,
      });
    } finally {
      setIsAdding(false);
    }
  }, [activePlaylist, activePlaylistId, activeIntent, addTrackToPlaylist]);

  const handleRefreshTracks = React.useCallback(async () => {
    if (!activePlaylistId || !activePlaylist || !activeIntent) return;

    setIsRefreshing(true);
    try {
      const query = buildCustomIntentQuery([...activeIntent.keywords]);

      if (typeof window !== "undefined" && window.umami && process.env.NODE_ENV === "production") {
        window.umami.track("youtube-api-search-videos", {
          context: "intent-refresh",
          intent: activePlaylist.name,
        });
      }
      const { results } = await searchYouTubeVideos(query, "video", {
        minDurationMinutes: minDuration,
        order: "relevance",
      });

      // Convert search results to tracks
      const newTracks = results
        .filter((r) => r?.id && r.title)
        .map((result) => {
          const thumb = getThumbnailUrl(result.id, "hqdefault");

          return {
            id: result.id,
            title: result.title,
            author: result.channelTitle,
            authorUrl: `https://www.youtube.com/channel/${
              result.channelId || ""
            }`,
            authorThumbnail: result.channelThumbnail,
            duration: result.length?.simpleText
              ? parseDuration(result.length.simpleText)
              : 0,
            thumbnailUrl: thumb,
            addedAt: Date.now(),
            publishedAt: result.publishedAt,
            publishedTimeText: result.publishedTimeText,
          };
        });

      // Remove all existing tracks and add new ones
      if (newTracks.length > 0) {
        // Remove all existing tracks
        activePlaylist.tracks.forEach((track) => {
          removeTrackFromPlaylist(activePlaylistId, track.id);
        });

        // Add all new tracks
        newTracks.forEach((track) => {
          addTrackToPlaylist(activePlaylistId, track);
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [
    activePlaylist,
    activePlaylistId,
    activeIntent,
    removeTrackFromPlaylist,
    addTrackToPlaylist,
  ]);

  const handleRemoveTrack = React.useCallback(
    (trackId: string) => {
      if (!activePlaylistId) return;
      removeTrackFromPlaylist(activePlaylistId, trackId);
    },
    [activePlaylistId, removeTrackFromPlaylist]
  );

  const handleDelete = React.useCallback(() => {
    if (!activePlaylistId || !activeIntent || !activePlaylist) return;

    // If this playlist is currently playing, clear the current playlist first
    if (currentPlaylistId === activePlaylistId) {
      setCurrentPlaylist(null);
    }

    deletePlaylist(activePlaylistId);

    // Navigate back to grid view
    returnToGrid("intents");
  }, [
    activePlaylistId,
    activeIntent,
    activePlaylist,
    currentPlaylistId,
    setCurrentPlaylist,
    deletePlaylist,
    returnToGrid,
  ]);

  const handleSwitchGradient = React.useCallback(() => {
    if (!activePlaylistId) return;
    const newGradient = getRandomGradient();
    setGradientOverride(activePlaylistId, newGradient);
  }, [activePlaylistId, setGradientOverride]);

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
              returnToGrid("intents");
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

          <div className="flex items-center gap-1">
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
            </Button>

            <Button
              onClick={handleRefreshTracks}
              disabled={isRefreshing || !activePlaylistId}
              variant="ghost"
              size="icon"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setIsEditDialogOpen(true)}
                  disabled={!activePlaylistId}
                >
                  <Pencil className="h-4 w-4" />
                  Edit Intent
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSwitchGradient}
                  disabled={!activePlaylistId}
                >
                  <Shuffle className="h-4 w-4" />
                  Random Gradient
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="text-red-400" />
                  Delete Intent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-1 mt-4 mb-2 px-3 flex-1 overflow-y-auto">
          {activePlaylist.tracks.map((track, index) => (
            <div
              key={`${track.id}-${track.addedAt}`}
              className="motion-preset-blur-down"
              style={
                {
                  "--motion-delay": `${index * 50 + 450}ms`,
                } as React.CSSProperties
              }
            >
              <TrackItemSmall
                key={`${track.id}-${track.addedAt}`}
                track={track}
                isCurrentTrack={
                  currentPlaylistId === activePlaylistId &&
                  currentActualTrackIndex === index
                }
                onClick={() => handleTrackClick(index)}
                onRemove={() => handleRemoveTrack(track.id)}
                align="left"
              />
            </div>
          ))}
        </div>
      </div>

      {activePlaylistId && (
        <EditIntentDialog
          playlistId={activePlaylistId}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </motion.section>
  );
}
