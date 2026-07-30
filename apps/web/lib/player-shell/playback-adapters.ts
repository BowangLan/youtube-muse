import type { PlaybackSource } from "@/lib/player-core/types"

/**
 * A playback backend the command runner can drive. Adapters receive raw
 * 0-100 volume; each backend applies its own scaling. `load` receives the
 * source-specific track ref (YouTube video id / Spotify track id).
 */
export interface PlaybackAdapter {
  play: () => void
  pause: () => void
  seek: (seconds: number) => void
  load: (trackRef: string, autoplay: boolean) => void
  setVolume: (volume: number) => void
}

const adapters: Partial<Record<PlaybackSource, PlaybackAdapter>> = {}

export function registerPlaybackAdapter(
  source: PlaybackSource,
  adapter: PlaybackAdapter
): void {
  adapters[source] = adapter
}

export function unregisterPlaybackAdapter(source: PlaybackSource): void {
  delete adapters[source]
}

export function getPlaybackAdapter(
  source: PlaybackSource
): PlaybackAdapter | null {
  return adapters[source] ?? null
}

/** Pause every registered backend except the given one (used on source switches). */
export function pauseOtherSources(activeSource: PlaybackSource): void {
  for (const [source, adapter] of Object.entries(adapters)) {
    if (source !== activeSource) {
      adapter.pause()
    }
  }
}
