import type { PlayerCommand, PlayerEvent, PlayerState } from "./types"
import { initialPlayerState } from "./types"

const SEEK_STEP_SECONDS = 10

const clamp = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, value))
}

const applyDerivedState = (state: PlayerState): PlayerState => {
  const isLoadingNewVideo = state.mode.tag === "loading"
  const isPlaying = state.observedPlayback === "playing"
  const pendingPlayState =
    state.desiredPlayback === "playing" && state.observedPlayback !== "playing"
      ? true
      : null

  return {
    ...state,
    isLoadingNewVideo,
    isPlaying,
    pendingPlayState,
  }
}

export const createPlayerState = () => initialPlayerState

export function reducePlayerState(
  state: PlayerState,
  event: PlayerEvent
): { state: PlayerState; commands: PlayerCommand[] } {
  const nextState: PlayerState = { ...state }
  const commands: PlayerCommand[] = []

  switch (event.type) {
    case "ApiReady": {
      nextState.apiReady = true
      break
    }
    case "PlayerReady": {
      nextState.playerReady = true
      if (event.duration > 0) {
        nextState.duration = event.duration
      }

      if (state.mode.tag === "loading") {
        commands.push({
          type: "Load",
          videoId: state.mode.videoId,
          autoplay: state.mode.autoplay,
        })
      } else if (
        state.mode.tag === "ready" &&
        state.desiredPlayback === "playing"
      ) {
        commands.push({ type: "Play" })
      }
      break
    }
    case "TrackSelected": {
      const requestId = state.loadRequestId + 1
      nextState.loadRequestId = requestId
      nextState.mode = {
        tag: "loading",
        videoId: event.videoId,
        requestId,
        autoplay: event.autoplay,
      }
      nextState.currentTime = 0
      nextState.duration = 0
      nextState.observedPlayback = "paused"
      if (event.autoplay) {
        nextState.desiredPlayback = "playing"
      }

      if (state.playerReady) {
        commands.push({
          type: "Load",
          videoId: event.videoId,
          autoplay: event.autoplay,
        })
      }
      break
    }
    case "UserTogglePlay": {
      const desiredPlayback =
        state.desiredPlayback === "playing" ? "paused" : "playing"
      nextState.desiredPlayback = desiredPlayback
      if (state.playerReady) {
        commands.push({ type: desiredPlayback === "playing" ? "Play" : "Pause" })
      }
      break
    }
    case "UserPlay": {
      nextState.desiredPlayback = "playing"
      if (state.playerReady) {
        commands.push({ type: "Play" })
      }
      break
    }
    case "UserPause": {
      nextState.desiredPlayback = "paused"
      if (state.playerReady) {
        commands.push({ type: "Pause" })
      }
      break
    }
    case "UserSeek": {
      const targetTime = clamp(event.seconds, 0, state.duration || event.seconds)
      nextState.currentTime = targetTime
      if (state.playerReady) {
        commands.push({ type: "Seek", seconds: targetTime })
      }
      break
    }
    case "UserSkipForward": {
      const targetTime = clamp(
        state.currentTime + SEEK_STEP_SECONDS,
        0,
        state.duration || state.currentTime + SEEK_STEP_SECONDS
      )
      nextState.currentTime = targetTime
      if (state.playerReady) {
        commands.push({ type: "Seek", seconds: targetTime })
      }
      break
    }
    case "UserSkipBackward": {
      const targetTime = clamp(
        state.currentTime - SEEK_STEP_SECONDS,
        0,
        state.duration || state.currentTime
      )
      nextState.currentTime = targetTime
      if (state.playerReady) {
        commands.push({ type: "Seek", seconds: targetTime })
      }
      break
    }
    case "UserSetVolume": {
      nextState.volume = clamp(event.volume, 0, 100)
      if (state.playerReady) {
        commands.push({ type: "SetVolume", volume: nextState.volume })
      }
      break
    }
    case "UserNextTrack": {
      commands.push({ type: "RequestNextTrack" })
      break
    }
    case "UserPreviousTrack": {
      commands.push({ type: "RequestPreviousTrack" })
      break
    }
    case "TimeTick": {
      const nextTime = clamp(
        event.currentTime,
        0,
        state.duration || event.currentTime
      )
      nextState.currentTime = nextTime
      break
    }
    case "PlayerStateChanged": {
      nextState.observedPlayback = event.state
      if (event.duration && event.duration > 0) {
        nextState.duration = event.duration
      }

      if (event.state === "cued") {
        nextState.currentTime = 0
      }

      if (
        state.mode.tag === "loading" &&
        ["cued", "playing", "paused", "buffering"].includes(event.state)
      ) {
        nextState.mode = { tag: "ready", videoId: state.mode.videoId }
      }

      if (
        state.mode.tag === "ready" &&
        state.desiredPlayback === "paused" &&
        event.state === "playing"
      ) {
        commands.push({ type: "Pause" })
      }

      if (
        state.mode.tag === "ready" &&
        state.desiredPlayback === "playing" &&
        event.state === "paused"
      ) {
        commands.push({ type: "Play" })
      }

      if (event.state === "cued" && state.desiredPlayback === "playing") {
        commands.push({ type: "Play" })
      }

      if (event.state === "ended") {
        commands.push({ type: "RequestNextTrack" })
      }
      break
    }
    default: {
      const _exhaustiveCheck: never = event
      void _exhaustiveCheck
      return { state, commands: [] }
    }
  }

  return { state: applyDerivedState(nextState), commands }
}
