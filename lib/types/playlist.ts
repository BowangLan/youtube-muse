export interface Track {
  id: string // YouTube video ID
  title: string
  author: string
  authorUrl: string
  duration: number
  thumbnailUrl: string
  addedAt: number
}

export interface Playlist {
  id: string
  name: string
  description?: string
  tracks: Track[]
  createdAt: number
  updatedAt: number
}

export type RepeatMode = "off" | "playlist" | "one"

export interface PlaylistState {
  playlists: Playlist[]
  currentPlaylistId: string | null
  currentTrackIndex: number
  isShuffleEnabled: boolean
  shuffleOrder: number[] // Indexes representing the shuffled order of tracks
  repeatMode: RepeatMode
}
