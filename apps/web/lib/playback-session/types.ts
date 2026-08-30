import type { PlaybackSource, PlaybackState } from "@/lib/player-core/types";

export type SessionTrack = { id: string; source?: PlaybackSource };

/** Identity accompanies every observation, including progress samples. */
export interface PlaybackObservation {
  trackId: string;
  state?: PlaybackState;
  currentTime?: number;
  duration?: number;
}

export interface PlaybackAdapter {
  play: () => void | Promise<void>;
  pause: () => void | Promise<void>;
  seek: (seconds: number) => void | Promise<void>;
  load: (trackId: string, autoplay: boolean, signal: AbortSignal) => void | Promise<void>;
  setVolume: (volume: number) => void | Promise<void>;
  read: () => PlaybackObservation | null | Promise<PlaybackObservation | null>;
  /** Spotify reports natural ends by rewinding to paused-at-zero. */
  endsByRewinding?: boolean;
}

/** Scoped to one SDK lifetime; callbacks after disconnect are harmless. */
export interface PlaybackConnection {
  ready: () => void;
  unavailable: () => void;
  observe: (observation: PlaybackObservation) => boolean;
  fail: (reason: string, trackId?: string) => void;
  disconnect: () => void;
}

export interface PlaybackQueue {
  next: () => SessionTrack | null;
  previous: () => SessionTrack | null;
  repeatMode: () => "off" | "playlist" | "one";
}
