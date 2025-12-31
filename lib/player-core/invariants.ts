import type { PlayerState } from "./types"

export function assertPlayerInvariants(state: PlayerState) {
  if (Number.isNaN(state.currentTime) || state.currentTime < 0) {
    throw new Error("Invalid currentTime in player state")
  }

  if (Number.isNaN(state.duration) || state.duration < 0) {
    throw new Error("Invalid duration in player state")
  }

  if (state.volume < 0 || state.volume > 100) {
    throw new Error("Volume must be between 0 and 100")
  }

  if (state.mode.tag === "loading" && !state.mode.videoId) {
    throw new Error("Loading mode requires a videoId")
  }

  if (state.mode.tag === "ready" && !state.mode.videoId) {
    throw new Error("Ready mode requires a videoId")
  }
}
