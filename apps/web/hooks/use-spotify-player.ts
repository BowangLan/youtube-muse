"use client";

import * as React from "react";
import { playbackSession, usePlayerStore } from "@/lib/store/player-store";
import { useSpotifyStore } from "@/lib/store/spotify-store";
import { useSpotifyPlayerStore } from "@/lib/store/spotify-player-store";
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";
import { tokensHavePlaybackScopes } from "@/lib/spotify/auth";
import { startPlayback } from "@/lib/spotify/api";
import { createSpotifyAdapter, spotifyObservation } from "@/lib/player-shell/spotify-adapter";
import type { PlaybackConnection } from "@/lib/playback-session/types";

const SDK_SCRIPT_SRC = "https://sdk.scdn.co/spotify-player.js";
let sdkLoadPromise: Promise<void> | null = null;

function loadSpotifySdk(): Promise<void> {
  if (window.Spotify) return Promise.resolve();
  if (sdkLoadPromise) return sdkLoadPromise;
  sdkLoadPromise = new Promise<void>((resolve) => {
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    if (!document.querySelector(`script[src="${SDK_SCRIPT_SRC}"]`)) {
      const tag = document.createElement("script");
      tag.src = SDK_SCRIPT_SRC;
      tag.async = true;
      document.head.appendChild(tag);
    }
  });
  return sdkLoadPromise;
}

/** Spotify device lifecycle and translation; no cross-source transition policy. */
export function useSpotifyPlayer() {
  const scope = useSpotifyStore((state) => state.tokens?.scope);
  const isConnected = useSpotifyStore((state) => state.tokens !== null);
  const canPlayback = isConnected && tokensHavePlaybackScopes(scope);
  const activeSource = usePlayerStore((state) => state.activeSource);

  React.useEffect(() => {
    if (activeSource !== "spotify") return;
    const { videoMode, setVideoMode } = useYouTubePlayerInstanceStore.getState();
    if (videoMode !== "hidden") setVideoMode("hidden");
  }, [activeSource]);

  React.useEffect(() => {
    if (!canPlayback) return;
    let cancelled = false;
    let player: SpotifySDK.Player | null = null;
    let connection: PlaybackConnection | null = null;
    let deviceId: string | null = null;
    const getAccessToken = () => useSpotifyStore.getState().getValidAccessToken();
    const reportError = (message: string) => {
      if (cancelled) return;
      useSpotifyPlayerStore.getState().setPlaybackError(message);
      connection?.fail(message);
    };

    void (async () => {
      await loadSpotifySdk();
      if (cancelled || !window.Spotify) return;
      player = new window.Spotify.Player({
        name: "YouTube Muse",
        getOAuthToken: (cb) => {
          void (async () => {
            const token = await getAccessToken();
            if (token && !cancelled) cb(token);
          })().catch(() => reportError("Spotify authentication failed"));
        },
        volume: playbackSession.getState().volume / 100,
      });
      connection = playbackSession.connect(
        "spotify",
        createSpotifyAdapter({
          getPlayer: () => player,
          getDeviceId: () => deviceId,
          getAccessToken,
          startPlayback: (token, device, track, signal) =>
            startPlayback(token, device, track, 0, signal),
        }),
      );
      player.addListener("ready", ({ device_id }) => {
        if (cancelled) return;
        deviceId = device_id;
        useSpotifyPlayerStore.getState().setDevice(device_id, true);
        useSpotifyPlayerStore.getState().setPlaybackError(null);
        connection?.ready();
      });
      player.addListener("not_ready", ({ device_id }) => {
        if (cancelled) return;
        deviceId = null;
        useSpotifyPlayerStore.getState().setDevice(device_id, false);
        connection?.unavailable();
      });
      player.addListener("player_state_changed", (state) => {
        if (!cancelled && state) connection?.observe(spotifyObservation(state));
      });
      player.addListener("initialization_error", ({ message }) =>
        reportError(`Spotify player failed to initialize: ${message}`),
      );
      player.addListener("authentication_error", ({ message }) =>
        reportError(`Spotify authentication failed: ${message}`),
      );
      player.addListener("account_error", () =>
        reportError("Spotify Premium is required to play music in the browser."),
      );
      player.addListener("playback_error", ({ message }) =>
        reportError(`Spotify playback failed: ${message}`),
      );
      useSpotifyPlayerStore.getState().setPlayer(player);
      if (!(await player.connect())) reportError("Spotify connection failed");
    })().catch((error: unknown) =>
      reportError(error instanceof Error ? error.message : "Spotify connection failed"),
    );
    return () => {
      cancelled = true;
      connection?.disconnect();
      player?.disconnect();
      useSpotifyPlayerStore.getState().reset();
    };
  }, [canPlayback]);
}
