export type PlaybackState =
  | "unstarted"
  | "ended"
  | "playing"
  | "paused"
  | "buffering"
  | "cued"

export type DesiredPlayback = "playing" | "paused"

export type PlayerMode =
  | { tag: "uninitialized" }
  | { tag: "loading"; videoId: string; requestId: number; autoplay: boolean }
  | { tag: "ready"; videoId: string }
  | { tag: "error"; reason: string }

export type PlayerCommand =
  | { type: "Play" }
  | { type: "Pause" }
  | { type: "Seek"; seconds: number }
  | { type: "Load"; videoId: string; autoplay: boolean }
  | { type: "SetVolume"; volume: number }
  | { type: "RequestNextTrack" }
  | { type: "RequestPreviousTrack" }

export type PlayerEvent =
  | { type: "ApiReady" }
  | { type: "PlayerReady"; duration: number }
  | { type: "PlayerStateChanged"; state: PlaybackState; duration?: number }
  | { type: "PlayerLoadFailed"; reason?: string }
  | { type: "TimeTick"; currentTime: number }
  | { type: "TrackSelected"; videoId: string; autoplay: boolean }
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
  apiReady: boolean
  playerReady: boolean
  isPlaying: boolean
  pendingPlayState: boolean | null
  isLoadingNewVideo: boolean
  currentTime: number
  duration: number
  volume: number
  desiredPlayback: DesiredPlayback
  observedPlayback: PlaybackState
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
