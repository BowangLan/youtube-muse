"use client";

import * as React from "react";
import type { YTPlayer } from "@/lib/types/youtube";
import type { PlaybackState } from "@/lib/player-core/types";
import { playbackSession, usePlayerStore } from "@/lib/store/player-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";
import { createYouTubeAdapter } from "@/lib/player-shell/youtube-adapter";
import {
  ensureYouTubePlayerElement,
  setYouTubePlayerElement,
} from "@/components/player/youtube-player-element";
import { useVideoQuality } from "@/hooks/use-video-quality";

const STATE_MAP: Record<number, PlaybackState> = {
  [-1]: "unstarted",
  0: "ended",
  1: "playing",
  2: "paused",
  3: "buffering",
  5: "cued",
};

/** YouTube resources and event translation; playback policy lives in the session. */
export function useYouTubePlayer() {
  const apiReady = usePlayerStore((state) => state.apiReady);
  useVideoQuality();

  React.useEffect(() => {
    let cancelled = false;
    let readyTimeout: ReturnType<typeof setTimeout> | undefined;
    const markReady = () => {
      // Preserve the existing startup delay for the IFrame host.
      readyTimeout = setTimeout(() => {
        if (!cancelled) playbackSession.dispatch({ type: "ApiReady" });
      }, 1200);
    };
    if (window.YT?.Player) {
      markReady();
    } else {
      window.onYouTubeIframeAPIReady = markReady;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }
    return () => {
      cancelled = true;
      clearTimeout(readyTimeout);
    };
  }, []);

  React.useEffect(() => {
    if (!apiReady) return;
    ensureYouTubePlayerElement();
    let player: YTPlayer | null = null;
    let cancelled = false;
    const connection = playbackSession.connect(
      "youtube",
      createYouTubeAdapter(() => player),
    );
    player = new window.YT.Player("youtube-player", {
      height: "100%",
      width: "100%",
      videoId: "",
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
      },
      events: {
        onReady: (event) => {
          if (cancelled) return;
          player = event.target;
          const iframe = player.getIframe?.();
          if (iframe) setYouTubePlayerElement(iframe);
          try {
            player.setPlaybackQuality("small");
          } catch (error) {
            console.error("Failed to set initial quality:", error);
          }
          connection.ready();
        },
        onStateChange: (event) => {
          if (cancelled) return;
          const mappedState = STATE_MAP[event.data] ?? "unstarted";
          const duration = event.target.getDuration();
          const trackId = event.target.getVideoData().video_id;
          const accepted = connection.observe({
            trackId,
            state: mappedState,
            duration: duration > 0 ? duration : undefined,
          });
          if (!accepted || (mappedState !== "cued" && mappedState !== "playing")) return;
          const playlist = usePlaylistStore.getState();
          const track = playlist.getCurrentTrack();
          if (
            playlist.currentPlaylistId &&
            track?.id === trackId &&
            !track.duration &&
            duration > 0
          ) {
            playlist.updateTrackInfo(playlist.currentPlaylistId, trackId, { duration });
          }
        },
        onError: (event) => {
          if (!cancelled)
            connection.fail(
              `YouTube player error code: ${event.data}`,
              event.target.getVideoData().video_id,
            );
        },
      },
    });
    useYouTubePlayerInstanceStore.getState().setPlayer(player);
    return () => {
      cancelled = true;
      connection.disconnect();
      player?.destroy?.();
      useYouTubePlayerInstanceStore.getState().clearPlayer();
      setYouTubePlayerElement(null);
    };
  }, [apiReady]);
}
