/**
 * Check if a URL is a YouTube Short
 */
export function isYouTubeShort(url: string): boolean {
  return /youtube\.com\/shorts\//.test(url)
}

/**
 * Extract YouTube video ID from various URL formats
 * Returns null for YouTube Shorts URLs to exclude them
 */
export function extractVideoId(url: string): string | null {
  // Reject YouTube Shorts URLs
  if (isYouTubeShort(url)) {
    return null
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
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
