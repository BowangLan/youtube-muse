export type PlaybackState =
  | "unstarted"
  | "ended"
  | "playing"
  | "paused"
  | "buffering"
  | "cued"

export type DesiredPlayback = "playing" | "paused"

/**
 * Which playback backend a track plays through. The reducer treats track ids
 * as opaque refs (YouTube video id or Spotify track id) — the shell routes
 * commands to the adapter registered for the active source.
 */
export type PlaybackSource = "youtube" | "spotify"

export type PlayerMode =
  | { tag: "uninitialized" }
  | {
      tag: "loading"
      videoId: string
      requestId: number
      autoplay: boolean
      source: PlaybackSource
    }
  | { tag: "ready"; videoId: string; source: PlaybackSource }
  | { tag: "error"; reason: string }

export type PlayerCommand =
  | { type: "Play" }
  | { type: "Pause" }
  | { type: "Seek"; seconds: number }
  | { type: "Load"; videoId: string; autoplay: boolean; source: PlaybackSource }
  | { type: "SetVolume"; volume: number }
  | { type: "RequestNextTrack" }
  | { type: "RequestPreviousTrack" }

export type PlayerEvent =
  | { type: "ApiReady" }
  | { type: "SourceAvailabilityChanged"; ready: boolean }
  | { type: "SelectionCleared" }
  | { type: "PlayerReady"; duration: number }
  | { type: "PlayerStateChanged"; state: PlaybackState; duration?: number }
  | { type: "PlayerLoadFailed"; reason?: string }
  | { type: "TimeTick"; currentTime: number }
  | {
      type: "TrackSelected"
      videoId: string
      autoplay: boolean
      source: PlaybackSource
    }
  | { type: "UserTogglePlay" }
  | { type: "UserPlay" }
  | { type: "UserPause" }
  | { type: "UserSeek"; seconds: number }
  | { type: "UserSkipForward" }
  | { type: "UserSkipBackward" }
  | { type: "UserSetVolume"; volume: number }
  | { type: "UserNextTrack" }
  | { type: "UserPreviousTrack" }
  | { type: "UserToggleSliceRepeatMode" }
  | { type: "UserSetSliceStart"; seconds: number }
  | { type: "UserSetSliceEnd"; seconds: number }
  | { type: "UserSetSliceRepeatEnabled"; enabled: boolean }
  | { type: "UserClearSlice" }
  | { type: "UserSetSliceAutoRepeat"; autoRepeat: boolean }
  | { type: "SliceBoundaryReached" }

export interface PlayerState {
  /** YouTube script bootstrap flag, retained for the existing startup screen. */
  apiReady: boolean
  /** Readiness of the selected playback source, not YouTube's readiness. */
  playerReady: boolean
  isPlaying: boolean
  pendingPlayState: boolean | null
  isLoadingNewVideo: boolean
  currentTime: number
  duration: number
  volume: number
  desiredPlayback: DesiredPlayback
  observedPlayback: PlaybackState
  /** Backend the currently selected track plays through */
  activeSource: PlaybackSource
  mode: PlayerMode
  loadRequestId: number
  sliceRepeat: {
    isActive: boolean
    startTime: number | null
    endTime: number | null
    isSliceSet: boolean
    autoRepeat: boolean
  }
}

/** UI intent and bootstrap notification; source events use a scoped connection. */
export type PlayerAction = Extract<PlayerEvent, { type: `User${string}` | "ApiReady" }>;

export const initialPlayerState: PlayerState = {
  apiReady: false,
  playerReady: false,
  isPlaying: false,
  pendingPlayState: null,
  isLoadingNewVideo: false,
  currentTime: 0,
  duration: 0,
  volume: 100,
  desiredPlayback: "paused",
  observedPlayback: "paused",
  activeSource: "youtube",
  mode: { tag: "uninitialized" },
  loadRequestId: 0,
  sliceRepeat: {
    isActive: false,
    startTime: null,
    endTime: null,
    isSliceSet: false,
    autoRepeat: true,
  },
}
