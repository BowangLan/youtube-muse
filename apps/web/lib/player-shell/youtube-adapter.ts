import type { YTPlayer } from "@/lib/types/youtube"
import type { PlaybackAdapter } from "./playback-adapters"
import { normalizeVolume100 } from "./volume"

export function createYouTubeAdapter(
  getPlayer: () => YTPlayer | null
): PlaybackAdapter {
  return {
    play: () => {
      getPlayer()?.playVideo()
    },
    pause: () => {
      getPlayer()?.pauseVideo()
    },
    seek: (seconds) => {
      getPlayer()?.seekTo(seconds, true)
    },
    load: (trackRef, autoplay) => {
      const player = getPlayer()
      if (!player) return
      if (autoplay) {
        player.loadVideoById(trackRef)
      } else if (typeof player.cueVideoById === "function") {
        player.cueVideoById(trackRef)
      } else {
        player.loadVideoById(trackRef)
        player.pauseVideo()
      }
    },
    setVolume: (volume) => {
      getPlayer()?.setVolume(normalizeVolume100(volume))
    },
  }
}
