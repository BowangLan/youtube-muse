import type {
  PlayerCommand,
  PlayerEvent,
  PlaybackSource,
} from "@/lib/player-core/types"
import type { QueueAdapter } from "./queue-adapter"
import { getPlaybackAdapter, pauseOtherSources } from "./playback-adapters"

/* eslint-disable no-console */
const DEBUG_PLAYER = true
const debug = (...args: unknown[]) => {
  if (DEBUG_PLAYER) console.log("[cmd-runner]", ...args)
}

interface CommandContext {
  /** Source the reducer currently considers active — transport commands route here */
  getActiveSource: () => PlaybackSource
  dispatch: (event: PlayerEvent) => void
  queueAdapter?: QueueAdapter
}

export function runPlayerCommands(
  commands: PlayerCommand[],
  context: CommandContext
) {
  if (!commands.length) return

  const activeAdapter = () => getPlaybackAdapter(context.getActiveSource())

  for (const command of commands) {
    switch (command.type) {
      case "Play": {
        activeAdapter()?.play()
        break
      }
      case "Pause": {
        activeAdapter()?.pause()
        break
      }
      case "Seek": {
        activeAdapter()?.seek(command.seconds)
        break
      }
      case "Load": {
        const adapter = getPlaybackAdapter(command.source)
        debug("Load command", {
          trackRef: command.videoId,
          autoplay: command.autoplay,
          source: command.source,
          hasAdapter: !!adapter,
        })
        // Switching backends: silence whichever source was playing before
        pauseOtherSources(command.source)
        adapter?.load(command.videoId, command.autoplay)
        break
      }
      case "SetVolume": {
        activeAdapter()?.setVolume(command.volume)
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
