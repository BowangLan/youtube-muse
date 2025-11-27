export interface Track {
  id: string // YouTube video ID
  title: string
  author: string
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

export interface PlaylistState {
  playlists: Playlist[]
  currentPlaylistId: string | null
  currentTrackIndex: number
}
