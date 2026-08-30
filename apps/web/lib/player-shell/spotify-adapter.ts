import type { PlaybackAdapter, PlaybackObservation } from "@/lib/playback-session/types";
import { normalizeVolume1 } from "./volume";

export function spotifyObservation(state: SpotifySDK.WebPlaybackState): PlaybackObservation {
  return {
    trackId: state.track_window.current_track?.uri.replace("spotify:track:", "") ?? "",
    state: state.loading ? "buffering" : state.paused ? "paused" : "playing",
    currentTime: state.position / 1000,
    duration: state.duration / 1000,
  };
}

interface SpotifyDependencies {
  getPlayer: () => Pick<
    SpotifySDK.Player,
    "resume" | "pause" | "seek" | "setVolume" | "getCurrentState"
  > | null;
  getDeviceId: () => string | null;
  getAccessToken: () => Promise<string | null>;
  startPlayback: (
    token: string,
    deviceId: string,
    trackId: string,
    signal: AbortSignal,
  ) => Promise<void>;
}

/** The SDK has no cue operation: remember a non-autoplay load until play. */
export function createSpotifyAdapter(dependencies: SpotifyDependencies): PlaybackAdapter {
  const { getPlayer, getDeviceId, getAccessToken, startPlayback } = dependencies;
  let selection: {
    id: string;
    signal: AbortSignal;
    loaded: boolean;
    starting: Promise<void> | null;
  } | null = null;
  let hasContext = false;
  let wantsPlayback = false;

  const startTrack = () => {
    const track = selection;
    if (!track || track.signal.aborted) return;
    if (track.starting) return track.starting;
    track.starting = (async () => {
      const deviceId = getDeviceId();
      const token = await getAccessToken();
      if (track.signal.aborted || selection !== track) return;
      if (!deviceId || !token) throw new Error("Spotify player is not ready");
      try {
        await startPlayback(token, deviceId, track.id, track.signal);
        if (track.signal.aborted || selection !== track) return;
        track.loaded = true;
        hasContext = true;
        // A pause can arrive while the remote start is in flight.
        if (!wantsPlayback) await getPlayer()?.pause();
      } catch (error) {
        if (track.signal.aborted || selection !== track) return;
        const status = (error as Error & { status?: number }).status;
        throw new Error(
          status === 403
            ? "Spotify playback requires a Premium account"
            : `Failed to start Spotify playback (${status ?? "network error"})`,
        );
      } finally {
        track.starting = null;
      }
    })();
    return track.starting;
  };

  return {
    endsByRewinding: true,
    play: () => {
      wantsPlayback = true;
      if (!selection || selection.signal.aborted) return;
      return selection.loaded ? getPlayer()?.resume() : startTrack();
    },
    pause: async () => {
      wantsPlayback = false;
      // The SDK rejects pause/seek on a device that has never loaded a context.
      if (hasContext) return getPlayer()?.pause();
      const player = getPlayer();
      const state = await player?.getCurrentState();
      if (state) {
        hasContext = true;
        // A newer play/load may have superseded this asynchronous context check.
        if (!wantsPlayback) await player?.pause();
      }
    },
    seek: (seconds) => {
      if (selection?.loaded) return getPlayer()?.seek(Math.max(0, Math.round(seconds * 1000)));
    },
    load: (id, autoplay, signal) => {
      selection = { id, signal, loaded: false, starting: null };
      wantsPlayback = autoplay;
      if (autoplay) return startTrack();
      if (hasContext) return getPlayer()?.pause();
    },
    setVolume: (volume) => getPlayer()?.setVolume(normalizeVolume1(volume)),
    read: async () => {
      const state = await getPlayer()?.getCurrentState();
      if (!state) return null;
      // Observed SDK context also permits silencing a late remote start.
      hasContext = true;
      return spotifyObservation(state);
    },
  };
}
