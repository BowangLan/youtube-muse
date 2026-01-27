export interface Channel {
  id: string // YouTube channel ID (e.g., "UC_aEa8K-EOJ3D6gOs7HcyNg")
  title: string // Channel name (e.g., "LoFi Girl")
  thumbnailUrl: string // Channel thumbnail/avatar
  customUrl?: string // Channel custom URL (e.g., "@lofigirl")
  description?: string
  subscriberCount?: string
}
