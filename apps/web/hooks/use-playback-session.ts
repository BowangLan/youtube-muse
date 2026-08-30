"use client";

import { useEffect } from "react";
import { playbackSession } from "@/lib/store/player-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useMediaSession } from "@/hooks/use-media-session";
import { useYouTubePlayer } from "@/hooks/use-youtube-player";
import { useSpotifyPlayer } from "@/hooks/use-spotify-player";

/** Mount once per listening page; controls always talk to the same session. */
export function usePlaybackSession() {
  useEffect(() => {
    const interacted = () => playbackSession.allowAutoplay();
    // Capture precedes selection handlers, including synchronous queue updates.
    const options = { once: true, capture: true };
    window.addEventListener("click", interacted, options);
    window.addEventListener("keydown", interacted, options);
    window.addEventListener("touchstart", interacted, options);
    let disposed = false;
    let pending = false;
    const syncTrack = () =>
      playbackSession.selectTrack(usePlaylistStore.getState().getCurrentTrack());
    const unsubscribe = usePlaylistStore.subscribe(() => {
      // Selecting a row can set playlist then index in separate writes.
      // Coalesce the transaction instead of loading its intermediate first row.
      if (pending) return;
      pending = true;
      queueMicrotask(() => {
        pending = false;
        if (!disposed) syncTrack();
      });
    });
    syncTrack();
    return () => {
      disposed = true;
      unsubscribe();
      window.removeEventListener("click", interacted, options);
      window.removeEventListener("keydown", interacted, options);
      window.removeEventListener("touchstart", interacted, options);
    };
  }, []);
  useMediaSession();
  useYouTubePlayer();
  useSpotifyPlayer();
}
