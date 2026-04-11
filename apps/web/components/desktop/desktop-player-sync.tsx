"use client";

import * as React from "react";
import { useDesktopRuntime } from "@/components/desktop/desktop-runtime-provider";
import type {
  DesktopPlayerCommand,
  DesktopPlayerSnapshot,
} from "@/lib/desktop/types";
import { usePlayerStore } from "@/lib/store/player-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useShallow } from "zustand/react/shallow";

const mapCommandToEvent = (command: DesktopPlayerCommand) => {
  switch (command.type) {
    case "toggle-play":
      return { type: "UserTogglePlay" } as const;
    case "play":
      return { type: "UserPlay" } as const;
    case "pause":
      return { type: "UserPause" } as const;
    case "next":
      return { type: "UserNextTrack" } as const;
    case "previous":
      return { type: "UserPreviousTrack" } as const;
    case "seek":
      return { type: "UserSeek", seconds: command.seconds } as const;
    case "set-volume":
      return { type: "UserSetVolume", volume: command.volume } as const;
    default:
      return null;
  }
};

export function DesktopPlayerSync() {
  const { hasDesktopBridge, windowRole } = useDesktopRuntime();

  const dispatch = usePlayerStore((state) => state.dispatch);
  const playerState = usePlayerStore(
    useShallow((state) => ({
      isPlaying: state.isPlaying,
      isLoadingNewVideo: state.isLoadingNewVideo,
      apiReady: state.apiReady,
      pendingPlayState: state.pendingPlayState,
      currentTime: state.currentTime,
      duration: state.duration,
      volume: state.volume,
    })),
  );
  const playlistState = usePlaylistStore(
    useShallow((state) => ({
      track: state.getCurrentTrack(),
      repeatMode: state.repeatMode,
      currentTrackIndex: state.currentTrackIndex,
      playlists: state.playlists,
      currentPlaylistId: state.currentPlaylistId,
    })),
  );

  React.useEffect(() => {
    if (!hasDesktopBridge || windowRole !== "desktop-main") {
      return;
    }

    return window.youtubeMuseDesktop?.player.onCommand((command) => {
      const event = mapCommandToEvent(command);
      if (event) {
        dispatch(event);
      }
    });
  }, [dispatch, hasDesktopBridge, windowRole]);

  React.useEffect(() => {
    if (!hasDesktopBridge || windowRole !== "desktop-main") {
      return;
    }

    const currentPlaylist = playlistState.playlists.find(
      (playlist) => playlist.id === playlistState.currentPlaylistId,
    );
    const trackCount = currentPlaylist?.tracks.length ?? 0;

    const snapshot: DesktopPlayerSnapshot = {
      track: playlistState.track
        ? {
            id: playlistState.track.id,
            title: playlistState.track.title,
            author: playlistState.track.author,
            authorUrl: playlistState.track.authorUrl,
            thumbnailUrl: playlistState.track.thumbnailUrl,
          }
        : null,
      isPlaying: playerState.isPlaying,
      isLoadingNewVideo: playerState.isLoadingNewVideo,
      apiReady: playerState.apiReady,
      pendingPlayState: playerState.pendingPlayState,
      currentTime: playerState.currentTime,
      duration: playerState.duration,
      volume: playerState.volume,
      canPlayNext:
        !!currentPlaylist &&
        (playlistState.repeatMode === "playlist"
          ? trackCount > 0
          : playlistState.currentTrackIndex < trackCount - 1),
      canPlayPrevious:
        !!currentPlaylist &&
        (playlistState.repeatMode === "playlist"
          ? trackCount > 0
          : playlistState.currentTrackIndex > 0),
    };

    window.youtubeMuseDesktop?.player.publishState(snapshot);
  }, [hasDesktopBridge, playerState, playlistState, windowRole]);

  return null;
}

