"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TrackItemSmall } from "@/components/playlist/track-item-small";
import {
  ArrowLeft,
  Loader2,
  MoreVertical,
  Palette,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { EditIntentDialog } from "@/components/intent/edit-intent-dialog";
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
  INTENTS,
  buildIntentQuery,
  buildCustomIntentQuery,
  getIntentByName,
  getRandomGradient,
} from "@/lib/intents";
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
  const setCurrentPlaylist = usePlaylistStore(
    (state) => state.setCurrentPlaylist
  );
  const addTrackToPlaylist = usePlaylistStore(
    (state) => state.addTrackToPlaylist
  );
  const removeTrackFromPlaylist = usePlaylistStore(
    (state) => state.removeTrackFromPlaylist
  );

  const togglePlay = usePlayerStore((state) => state.togglePlay);

  const customIntents = useCustomIntentsStore((state) => state.customIntents);
  const removeCustomIntent = useCustomIntentsStore(
    (state) => state.removeCustomIntent
  );
  const updateCustomIntent = useCustomIntentsStore(
    (state) => state.updateCustomIntent
  );
  const setGradientOverride = useCustomIntentsStore(
    (state) => state.setGradientOverride
  );
  const gradientOverrides = useCustomIntentsStore(
    (state) => state.gradientOverrides
  );
  const hideBuiltInIntent = useCustomIntentsStore(
    (state) => state.hideBuiltInIntent
  );

  const deletePlaylist = usePlaylistStore((state) => state.deletePlaylist);

  const [isAdding, setIsAdding] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  // Derive active playlist from stores
  const activePlaylist = React.useMemo(() => {
    if (!activePlaylistId) return undefined;
    return playlists.find((p) => p.id === activePlaylistId);
  }, [activePlaylistId, playlists]);

  // Derive active intent from playlist name (check both built-in and custom)
  const activeIntent = React.useMemo(() => {
    // First check built-in intents
    const builtIn = getIntentByName(activePlaylist?.name);
    if (builtIn) return builtIn;
    // Then check custom intents
    if (!activePlaylistId) return undefined;
    return customIntents.find((ci) => ci.playlistId === activePlaylistId);
  }, [activePlaylist?.name, activePlaylistId, customIntents]);

  // Check if this is a custom intent (can be deleted/modified)
  const isCustomIntent = React.useMemo(() => {
    return (
      activeIntent &&
      "isCustom" in activeIntent &&
      activeIntent.isCustom === true
    );
  }, [activeIntent]);

  // Calculate actual track index considering shuffle
  const currentActualTrackIndex =
    isShuffleEnabled && shuffleOrder.length > 0
      ? shuffleOrder[currentTrackIndex] ?? currentTrackIndex
      : currentTrackIndex;

  // Get gradient - check for override first, then use intent's default
  const intentGradient = activePlaylistId
    ? gradientOverrides[activePlaylistId] ?? activeIntent?.gradientClassName
    : activeIntent?.gradientClassName;

  const handleTrackClick = React.useCallback(
    (index: number) => {
      if (!activePlaylistId) return;

      // If viewing a different playlist than the one currently playing, switch to it
      if (currentPlaylistId !== activePlaylistId) {
        setCurrentPlaylist(activePlaylistId);
        // setCurrentPlaylist resets to index 0, so we need to set the correct index
        setCurrentTrackIndex(index);
      } else if (currentActualTrackIndex === index) {
        togglePlay();
      } else {
        setCurrentTrackIndex(index);
      }
    },
    [
      activePlaylistId,
      currentPlaylistId,
      currentActualTrackIndex,
      togglePlay,
      setCurrentPlaylist,
      setCurrentTrackIndex,
    ]
  );

  const handleAddToIntent = React.useCallback(async () => {
    if (!activePlaylistId || !activePlaylist || !activeIntent) return;

    setIsAdding(true);
    try {
      // Build query based on intent type (built-in or custom)
      const builtInIntent = INTENTS.find((i) => i.name === activePlaylist.name);
      const query = builtInIntent
        ? buildIntentQuery(builtInIntent)
        : buildCustomIntentQuery([...activeIntent.keywords]);

      const { results } = await searchYouTubeVideos(query);
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
  }, [activePlaylist, activePlaylistId, activeIntent, addTrackToPlaylist]);

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

    if (isCustomIntent) {
      // Custom intent: remove from custom intents store and delete playlist
      const customIntent = customIntents.find(
        (ci) => ci.playlistId === activePlaylistId
      );
      if (customIntent) {
        removeCustomIntent(customIntent.id);
      }
      deletePlaylist(activePlaylistId);
    } else {
      // Built-in intent: hide it and delete the playlist
      hideBuiltInIntent(activePlaylist.name);
      deletePlaylist(activePlaylistId);
    }

    // Navigate back to grid view
    setView("grid");
  }, [
    activePlaylistId,
    activeIntent,
    activePlaylist,
    isCustomIntent,
    customIntents,
    currentPlaylistId,
    setCurrentPlaylist,
    removeCustomIntent,
    hideBuiltInIntent,
    deletePlaylist,
    setView,
  ]);

  const handleSwitchGradient = React.useCallback(() => {
    if (!activePlaylistId || !activeIntent) return;

    // Get current gradient (from override or intent default)
    const currentGradient =
      gradientOverrides[activePlaylistId] ?? activeIntent.gradientClassName;

    // Get a new random gradient (excluding current one)
    let newGradient = getRandomGradient(false); // Allow all gradients
    // Ensure we get a different gradient
    let attempts = 0;
    while (newGradient === currentGradient && attempts < 10) {
      newGradient = getRandomGradient(false);
      attempts++;
    }

    if (isCustomIntent) {
      // For custom intents, update the custom intent directly
      const customIntent = customIntents.find(
        (ci) => ci.playlistId === activePlaylistId
      );
      if (customIntent) {
        updateCustomIntent(customIntent.id, { gradientClassName: newGradient });
      }
    } else {
      // For built-in intents, store as gradient override
      setGradientOverride(activePlaylistId, newGradient);
    }
  }, [
    activePlaylistId,
    activeIntent,
    isCustomIntent,
    customIntents,
    gradientOverrides,
    updateCustomIntent,
    setGradientOverride,
  ]);

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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Pencil />
                  Edit Keywords
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSwitchGradient}>
                  <Palette />
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

        <div className="space-y-1 mt-4 mb-2 px-4">
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

      {/* Edit Intent Dialog */}
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
