"use client";

import * as React from "react";
import { usePlayerStore } from "@/lib/store/player-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { Track } from "@/lib/types/playlist";

interface MiniPlayerContextValue {
  // Track data
  track: Track | undefined;

  // Player state
  isPlaying: boolean;
  isLoadingNewVideo: boolean;
  pendingPlayState: boolean | null;
  apiReady: boolean;

  // Computed values
  canPlayNext: boolean;
  isExpanded: boolean;

  // Event handlers
  onTogglePlay: () => void;
  onSkipBackward: () => void;
  onPlayNext: () => void;
  onToggleExpanded?: () => void;
  onClose?: () => void;
}

const MiniPlayerContext = React.createContext<MiniPlayerContextValue | null>(null);

export function useMiniPlayerContext() {
  const context = React.useContext(MiniPlayerContext);
  if (!context) {
    throw new Error("useMiniPlayerContext must be used within a MiniPlayerProvider");
  }
  return context;
}

interface MiniPlayerProviderProps {
  children: React.ReactNode;
  isExpanded: boolean;
  onToggleExpanded?: () => void;
  onClose?: () => void;
}

export function MiniPlayerProvider({
  children,
  isExpanded,
  onToggleExpanded,
  onClose,
}: MiniPlayerProviderProps) {
  const track = usePlaylistStore((state) => state.getCurrentTrack());
  const {
    dispatch,
    isLoadingNewVideo,
    apiReady,
    pendingPlayState,
    isPlaying,
  } = usePlayerStore();
  const {
    repeatMode,
    currentTrackIndex,
    playlists,
    currentPlaylistId,
  } = usePlaylistStore();

  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);
  const canPlayNext =
    !!currentPlaylist &&
    (repeatMode === "playlist"
      ? currentPlaylist.tracks.length > 0
      : currentTrackIndex < currentPlaylist.tracks.length - 1);

  const value: MiniPlayerContextValue = {
    track,
    isPlaying,
    isLoadingNewVideo,
    pendingPlayState,
    apiReady,
    canPlayNext,
    isExpanded,
    onTogglePlay: () => dispatch({ type: "UserTogglePlay" }),
    onSkipBackward: () => dispatch({ type: "UserSkipBackward" }),
    onPlayNext: () => dispatch({ type: "UserNextTrack" }),
    onToggleExpanded,
    onClose,
  };

  return (
    <MiniPlayerContext.Provider value={value}>
      {children}
    </MiniPlayerContext.Provider>
  );
}
