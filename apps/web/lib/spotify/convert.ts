import type { SpotifyFavoriteTrack } from "./api"
import type { Track } from "@/lib/types/playlist"

export function toSpotifyTrack(track: SpotifyFavoriteTrack): Track {
  return {
    id: track.id,
    title: track.title,
    author: track.artists.join(", "),
    authorUrl: track.spotifyUrl,
    duration: track.duration,
    thumbnailUrl: track.albumArtUrl ?? "",
    addedAt: Date.parse(track.addedAt) || Date.now(),
    source: "spotify",
  }
}
