import type { PlayerCommand, PlayerEvent } from "@/lib/player-core/types"
import type { YTPlayer } from "@/lib/types/youtube"
import type { QueueAdapter } from "./queue-adapter"

/* eslint-disable no-console */
const DEBUG_PLAYER = true
const debug = (...args: unknown[]) => {
  if (DEBUG_PLAYER) console.log("[cmd-runner]", ...args)
}

interface CommandContext {
  getPlayer: () => YTPlayer | null
  dispatch: (event: PlayerEvent) => void
  queueAdapter?: QueueAdapter
}

const normalizeVolume = (volume: number) => {
  return ((Math.exp(volume / 100) - 1) / (Math.E - 1)) * 100
}

export function runPlayerCommands(
  commands: PlayerCommand[],
  context: CommandContext
) {
  if (!commands.length) return

  for (const command of commands) {
    switch (command.type) {
      case "Play": {
        context.getPlayer()?.playVideo()
        break
      }
      case "Pause": {
        context.getPlayer()?.pauseVideo()
        break
      }
      case "Seek": {
        context.getPlayer()?.seekTo(command.seconds, true)
        break
      }
      case "Load": {
        const player = context.getPlayer()
        debug("Load command", {
          videoId: command.videoId,
          autoplay: command.autoplay,
          hasPlayer: !!player,
        })
        if (!player) break

        if (command.autoplay) {
          debug("Load: loadVideoById (autoplay)")
          player.loadVideoById(command.videoId)
        } else if (typeof player.cueVideoById === "function") {
          debug("Load: cueVideoById (no autoplay)")
          player.cueVideoById(command.videoId)
        } else {
          debug("Load: loadVideoById + pause (fallback)")
          player.loadVideoById(command.videoId)
          player.pauseVideo()
        }
        break
      }
      case "SetVolume": {
        const player = context.getPlayer()
        if (!player) break
        player.setVolume(normalizeVolume(command.volume))
        break
      }
      case "RequestNextTrack": {
        const adapter = context.queueAdapter
        if (!adapter) break
        if (adapter.getRepeatMode?.() === "one") {
          context.dispatch({ type: "UserSeek", seconds: 0 })
          context.dispatch({ type: "UserPlay" })
          break
        }
        adapter.next()
        break
      }
      case "RequestPreviousTrack": {
        context.queueAdapter?.previous()
        break
      }
      default: {
        const _exhaustiveCheck: never = command
        void _exhaustiveCheck
        break
      }
    }
  }
}
