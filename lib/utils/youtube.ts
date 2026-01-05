/**
 * Check if a URL is a YouTube Short
 */
export function isYouTubeShort(url: string): boolean {
  return /youtube\.com\/shorts\//.test(url)
}

/**
 * Extract YouTube video ID from URL formats only
 * Returns null for YouTube Shorts URLs to exclude them
 */
export function extractVideoIdFromUrl(url: string): string | null {
  if (isYouTubeShort(url)) {
    return null
  }

  const trimmed = url.trim()
  const patterns = [
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/live\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Extract YouTube video ID from various URL formats
 * Returns null for YouTube Shorts URLs to exclude them
 */
export function extractVideoId(url: string): string | null {
  if (isYouTubeShort(url)) {
    return null
  }

  const urlMatch = extractVideoIdFromUrl(url)
  if (urlMatch) return urlMatch

  const trimmed = url.trim()
  const directId = trimmed.match(/^([a-zA-Z0-9_-]{11})$/)
  return directId ? directId[1] : null
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

/**
 * Parse YouTube duration string (MM:SS) or (HH:MM:SS) to seconds
 */
export function parseDuration(durationString: string): number {
  const parts = durationString.split(':')
  if (parts.length === 2) {
    const minutes = parseInt(parts[0], 10) || 0
    const seconds = parseInt(parts[1], 10) || 0
    return minutes * 60 + seconds
  } else if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0
    const minutes = parseInt(parts[1], 10) || 0
    const seconds = parseInt(parts[2], 10) || 0
    return hours * 3600 + minutes * 60 + seconds
  }
  return 0
}

/**
 * Get YouTube thumbnail URL for a video ID
 */
export function getThumbnailUrl(videoId: string, quality: "default" | "mqdefault" | "hqdefault" | "maxresdefault" = "maxresdefault"): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/**
 * Extract YouTube channel ID from various URL formats:
 * - https://www.youtube.com/channel/UC_aEa8K-EOJ3D6gOs7HcyNg
 * - https://www.youtube.com/@lofigirl
 * - https://www.youtube.com/c/LoFiGirl
 * - https://www.youtube.com/user/username
 * - UC_aEa8K-EOJ3D6gOs7HcyNg (direct ID)
 */
export function extractChannelId(url: string): string | null {
  const trimmed = url.trim()

  const patterns = [
    /youtube\.com\/channel\/([^\/\?&]+)/, // /channel/UC...
    /youtube\.com\/@([^\/\?&]+)/, // /@handle
    /youtube\.com\/c\/([^\/\?&]+)/, // /c/name
    /youtube\.com\/user\/([^\/\?&]+)/, // /user/name (legacy)
    /^(UC[a-zA-Z0-9_-]{22})$/, // Direct channel ID (starts with UC, 24 chars total)
    /^(@[a-zA-Z0-9_-]+)$/, // Direct handle @username
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Check if a string is a valid YouTube channel URL or identifier
 */
export function isChannelUrl(url: string): boolean {
  return extractChannelId(url) !== null
}

/**
 * Format timestamp to readable date string
 */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
