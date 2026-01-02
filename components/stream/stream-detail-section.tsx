"use client";

import * as React from "react";
import { useAppStateStore } from "@/lib/store/app-state-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { useStreamsStore } from "@/lib/store/streams-store";
import { getRandomGradient } from "@/lib/intents";
import { StreamDetailHeader } from "./stream-detail-header";
import { StreamTrackList } from "./stream-track-list";

export function StreamDetailSection() {
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
  const dispatch = usePlayerStore((state) => state.dispatch);

  const streams = useStreamsStore((state) => state.streams);
  const deleteStream = useStreamsStore((state) => state.deleteStream);
  const updateStream = useStreamsStore((state) => state.updateStream);
  // const refreshStream = useStreamsStore((state) => state.refreshStream);
  const removeTrackFromPlaylist = usePlaylistStore(
    (state) => state.removeTrackFromPlaylist
  );

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Derive active playlist from stores
  const activePlaylist = React.useMemo(() => {
    if (!activePlaylistId) return undefined;
    return playlists.find((p) => p.id === activePlaylistId);
  }, [activePlaylistId, playlists]);

  // Derive active stream from playlist
  const activeStream = React.useMemo(() => {
    if (!activePlaylistId) return undefined;
    return streams.find((s) => s.playlistId === activePlaylistId);
  }, [activePlaylistId, streams]);

  // Calculate actual track index considering shuffle
  const currentActualTrackIndex =
    isShuffleEnabled && shuffleOrder.length > 0
      ? (shuffleOrder[currentTrackIndex] ?? currentTrackIndex)
      : currentTrackIndex;

  // Get gradient
  const streamGradient = activeStream?.gradientClassName;

  const handleTrackClick = React.useCallback(
    (index: number) => {
      if (!activePlaylistId) return;

      // If viewing a different playlist than the one currently playing, switch to it
      if (currentPlaylistId !== activePlaylistId) {
        setCurrentPlaylist(activePlaylistId);
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

  // const handleRefreshStream = React.useCallback(async () => {
  //   if (!activeStream) return;

  //   setIsRefreshing(true);
  //   try {
  //     await refreshStream(activeStream.id);
  //   } catch (error) {
  //     console.error("Error refreshing stream:", error);
  //   } finally {
  //     setIsRefreshing(false);
  //   }
  // }, [activeStream, refreshStream]);

  const handleDelete = React.useCallback(() => {
    if (!activePlaylistId || !activeStream) return;

    // If this playlist is currently playing, clear the current playlist first
    if (currentPlaylistId === activePlaylistId) {
      setCurrentPlaylist(null);
    }

    // Delete stream (will also delete associated playlist)
    deleteStream(activeStream.id);

    // Navigate back to grid view
    returnToGrid("streams");
  }, [
    activePlaylistId,
    activeStream,
    currentPlaylistId,
    setCurrentPlaylist,
    deleteStream,
    returnToGrid,
  ]);

  const handleSwitchGradient = React.useCallback(() => {
    if (!activeStream) return;

    // Get a new random gradient (excluding current one)
    let newGradient = getRandomGradient(false);
    let attempts = 0;
    while (newGradient === activeStream.gradientClassName && attempts < 10) {
      newGradient = getRandomGradient(false);
      attempts++;
    }

    // Update stream with new gradient
    updateStream(activeStream.id, {
      gradientClassName: newGradient,
    });
  }, [activeStream, updateStream]);

  const handleRemoveTrack = React.useCallback(
    (trackId: string) => {
      if (!activePlaylistId) return;
      removeTrackFromPlaylist(activePlaylistId, trackId);
    },
    [activePlaylistId, removeTrackFromPlaylist]
  );

  const handleAddChannel = React.useCallback(
    (channel: Omit<import("@/lib/types/stream").Channel, "id">) => {
      if (!activeStream) return;

      // Generate a unique ID for the new channel
      const channelId = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add the channel to the stream
      updateStream(activeStream.id, {
        channels: [...activeStream.channels, { ...channel, id: channelId }],
      });
    },
    [activeStream, updateStream]
  );

  if (!activePlaylist || !activeStream) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white/60">
        <p>Stream not found</p>
      </div>
    );
  }

  return (
    <section className="relative flex min-h-screen h-full flex-col motion-preset-slide-up-sm">
      <StreamDetailHeader
        stream={activeStream}
        playlist={activePlaylist}
        // onRefresh={handleRefreshStream}
        onDelete={handleDelete}
        onSwitchGradient={handleSwitchGradient}
        onBack={() => returnToGrid("streams")}
        isRefreshing={isRefreshing}
        onAddChannel={handleAddChannel}
      />

      <StreamTrackList
        playlist={activePlaylist}
        currentPlaylistId={currentPlaylistId}
        currentActualTrackIndex={currentActualTrackIndex}
        onTrackClick={handleTrackClick}
        onRemoveTrack={handleRemoveTrack}
      />
    </section>
  );
}
