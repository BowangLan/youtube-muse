export interface Channel {
  id: string // YouTube channel ID (e.g., "UC_aEa8K-EOJ3D6gOs7HcyNg")
  title: string // Channel name (e.g., "LoFi Girl")
  thumbnailUrl: string // Channel thumbnail/avatar
  customUrl?: string // Channel custom URL (e.g., "@lofigirl")
}

export interface Stream {
  id: string // Generated unique ID
  name: string // Stream name (auto-generated or user-overridden)
  description?: string // Optional description
  channels: Channel[] // Array of subscribed channels
  trackLimit: number // Max tracks to fetch per stream (default 10)
  playlistId: string // Links to underlying playlist
  createdAt: number
  updatedAt: number
  lastRefreshedAt: number // Track when last auto-refreshed
  gradientClassName: string // Visual gradient (from GRADIENT_CLASS_NAMES)
}
