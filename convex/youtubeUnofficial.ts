// Video result type matching the schema in channelVideos.ts
export type UnofficialVideo = {
  videoId: string
  title: string
  url: string
  publishedAt?: string
  publishedAtMs?: number
  thumbnailUrl?: string
  duration?: number
  viewCount?: string
  channelTitle?: string
  channelThumbnailUrl?: string
}

const extractJsonBlock = (html: string, marker: string) => {
  const markerIndex = html.indexOf(marker)
  if (markerIndex === -1) {
    throw new Error(`Marker not found: ${marker}`)
  }

  const startIndex = html.indexOf("{", markerIndex)
  if (startIndex === -1) {
    throw new Error(`JSON start not found for: ${marker}`)
  }

  let depth = 0
  let inString = false
  let isEscaped = false

  for (let i = startIndex; i < html.length; i += 1) {
    const char = html[i]

    if (inString) {
      if (isEscaped) {
        isEscaped = false
      } else if (char === "\\") {
        isEscaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === "{") {
      depth += 1
    } else if (char === "}") {
      depth -= 1
      if (depth === 0) {
        return html.slice(startIndex, i + 1)
      }
    }
  }

  throw new Error(`JSON end not found for: ${marker}`)
}

/**
 * Parse duration string like "3:45" or "1:23:45" to seconds
 */
const parseDurationToSeconds = (lengthText: string | undefined): number | undefined => {
  if (!lengthText) return undefined

  const parts = lengthText.split(":").map(Number)
  if (parts.some(isNaN)) return undefined

  if (parts.length === 3) {
    // H:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    // M:SS
    return parts[0] * 60 + parts[1]
  }
  return undefined
}

/**
 * Parse relative time like "2 weeks ago" to approximate timestamp
 */
const parseRelativeTimeToMs = (publishedTime: string | undefined): number | undefined => {
  if (!publishedTime) return undefined

  const now = Date.now()
  const match = publishedTime.match(/(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i)
  if (!match) return undefined

  const amount = parseInt(match[1], 10)
  const unit = match[2].toLowerCase()

  const msPerUnit: Record<string, number> = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  }

  return now - amount * (msPerUnit[unit] ?? 0)
}

// Type for the video renderer from YouTube's unofficial response
type VideoRenderer = {
  videoId?: string
  title?: {
    runs?: Array<{ text?: string }>
  }
  ownerText?: {
    runs?: Array<{ text?: string }>
  }
  publishedTimeText?: {
    simpleText?: string
  }
  viewCountText?: {
    simpleText?: string
  }
  lengthText?: {
    simpleText?: string
  }
  thumbnail?: {
    thumbnails?: Array<{ url?: string; width?: number; height?: number }>
  }
}

/**
 * Fetch latest video IDs only (legacy function for backwards compatibility)
 */
export const fetchLatestVideoIds = async (channelId: string, limit = 20) => {
  const videos = await fetchLatestVideos(channelId, limit)
  return videos.map(v => v.videoId)
}

/**
 * Fetch latest videos with full details from a YouTube channel using web scraping
 */
export const fetchLatestVideos = async (channelId: string, limit = 20): Promise<UnofficialVideo[]> => {
  const url = channelId.startsWith("@")
    ? `https://www.youtube.com/${channelId}/videos?view=0&sort=dd&flow=grid`
    : `https://www.youtube.com/channel/${channelId}/videos?view=0&sort=dd&flow=grid`
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; YouTubeMuse/1.0; +https://example.com)",
      "Accept-Language": "en-US,en;q=0.9",
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  const initialDataJson = extractJsonBlock(html, "ytInitialData")
  const initialData = JSON.parse(initialDataJson)

  // Extract channel info from header
  const header = initialData?.header?.c4TabbedHeaderRenderer
  const channelTitle = header?.title
  const channelThumbnails = header?.avatar?.thumbnails ?? []
  const channelThumbnailUrl = channelThumbnails[channelThumbnails.length - 1]?.url

  const tabs = initialData?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? []
  const videosTab = tabs.find((tab: { tabRenderer?: { title?: string; endpoint?: { commandMetadata?: { webCommandMetadata?: { url?: string } } } } }) => {
    const renderer = tab?.tabRenderer
    if (!renderer) return false
    if (renderer.title === "Videos") return true
    return renderer.endpoint?.commandMetadata?.webCommandMetadata?.url?.includes("/videos")
  })

  const gridItems =
    videosTab?.tabRenderer?.content?.richGridRenderer?.contents ?? []

  const videos: UnofficialVideo[] = gridItems
    .map((item: { richItemRenderer?: { content?: { videoRenderer?: VideoRenderer } } }) =>
      item?.richItemRenderer?.content?.videoRenderer
    )
    .filter((renderer: VideoRenderer | undefined): renderer is VideoRenderer => Boolean(renderer?.videoId))
    .slice(0, limit)
    .map((renderer: VideoRenderer): UnofficialVideo => {
      const videoId = renderer.videoId!
      const title = renderer.title?.runs?.[0]?.text ?? ""
      const publishedTime = renderer.publishedTimeText?.simpleText
      const publishedAtMs = parseRelativeTimeToMs(publishedTime)
      const lengthText = renderer.lengthText?.simpleText
      const thumbnails = renderer.thumbnail?.thumbnails ?? []
      const thumbnailUrl = thumbnails[thumbnails.length - 1]?.url ?? thumbnails[0]?.url

      return {
        videoId,
        title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: publishedTime, // Store the relative time text as-is
        publishedAtMs,
        thumbnailUrl,
        duration: parseDurationToSeconds(lengthText),
        viewCount: renderer.viewCountText?.simpleText,
        channelTitle: renderer.ownerText?.runs?.[0]?.text ?? channelTitle,
        channelThumbnailUrl,
      }
    })

  return videos
}
