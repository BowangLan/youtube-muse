"use server"

import { api } from "@/convex/_generated/api"
import { fr } from "date-fns/locale"
import { google } from "googleapis"
import { query } from "@/convex/_generated/server"
import { convexClient } from "@/lib/convex-client"

// API Configuration Constants
const YOUTUBE_API_VERSION = "v3"
const YOUTUBE_API_PARTS = {
  SNIPPET: "snippet",
  STATISTICS: "statistics",
  CONTENT_DETAILS: "contentDetails",
} as const

// Search Configuration
const SEARCH_CONFIG = {
  TYPE_CHANNEL: ["channel"],
  MAX_RESULTS: 20,
  ORDER_RELEVANCE: "relevance",
}

// Channel Configuration
const CHANNEL_CONFIG = {
  UPLOADS_PLAYLIST_MAX_RESULTS: 50,
  VIDEO_RESOURCE_KIND: "youtube#video",
  MIN_VIDEO_DURATION_SECONDS: 60,
} as const

// Thumbnail Defaults
const THUMBNAIL_DEFAULTS = {
  HIGH_WIDTH: 800,
  HIGH_HEIGHT: 800,
  MEDIUM_WIDTH: 480,
  MEDIUM_HEIGHT: 360,
} as const

// Subscriber Count Formatting
const SUBSCRIBER_THRESHOLDS = {
  MILLION: 1000000,
  THOUSAND: 1000,
} as const

// Time Conversion Constants
const TIME_UNITS = {
  SECONDS_PER_HOUR: 3600,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  DAYS_PER_MONTH: 30,
  DAYS_PER_YEAR: 365,
} as const

// URL Constants
const YOUTUBE_URLS = {
  BASE: "https://www.youtube.com",
  CHANNEL_PATH: "/channel/",
  VIDEOS_PATH: "/videos",
  VIDEOS_TAB_TITLE: "Videos",
} as const

// HTTP Headers
const HTTP_HEADERS = {
  USER_AGENT: "Mozilla/5.0 (compatible; YouTubeMuse/1.0; +https://example.com)",
  ACCEPT_LANGUAGE: "en-US,en;q=0.9",
} as const

// JSON Parsing
const JSON_MARKERS = {
  YT_INITIAL_DATA: "ytInitialData",
} as const

// Error Messages
const ERROR_MESSAGES = {
  API_KEY_MISSING: "YouTube API key not configured. Please add YOUTUBE_API_KEY to your .env.local file.",
  SEARCH_FAILED: "Failed to search channels. Please check your API key and try again.",
  CHANNEL_NOT_FOUND: "Channel not found",
  FETCH_CHANNEL_FAILED: "Failed to fetch channel info",
  INVALID_CHANNEL_ID: "Invalid channel ID:",
  UPLOADS_PLAYLIST_NOT_FOUND: "Could not find uploads playlist",
  FETCH_VIDEOS_FAILED: "Failed to fetch channel videos. Please check your API key and try again.",
  REQUEST_FAILED: "Request failed:",
  NO_VIDEOS_FOUND: "No videos found for this channel",
  FETCH_LATEST_VIDEO_FAILED: "Failed to fetch latest video",
} as const

// Formatting Strings
const FORMAT_STRINGS = {
  SUBSCRIBERS_MILLION: "%.1fM subscribers",
  SUBSCRIBERS_THOUSAND: "%.1fK subscribers",
  SUBSCRIBERS_DEFAULT: "%d subscribers",
  TIME_AGO_YEAR: "%d year%s ago",
  TIME_AGO_MONTH: "%d month%s ago",
  TIME_AGO_WEEK: "%d week%s ago",
  TIME_AGO_DAY: "%d day%s ago",
  TIME_AGO_HOUR: "%d hour%s ago",
  TIME_AGO_MINUTE: "%d minute%s ago",
  TIME_AGO_JUST_NOW: "Just now",
  DURATION_HMS: "%d:%02d:%02d",
  DURATION_MS: "%d:%02d",
  DURATION_ZERO: "0:00",
} as const

// Create YouTube client function to avoid global state issues
const createYouTubeClient = () => google.youtube({
  version: YOUTUBE_API_VERSION,
  auth: process.env.YOUTUBE_API_KEY,
})

export type ChannelSearchResult = {
  id: string
  title: string
  thumbnail: {
    thumbnails: Array<{ url: string; width: number; height: number }>
  }
  customUrl?: string
  subscriberCount?: string
  subscriberCountRaw?: number // Raw number for sorting
}

export type ChannelVideoResult = {
  id: string
  title: string
  thumbnail: {
    thumbnails: Array<{ url: string; width: number; height: number }>
  }
  channelTitle: string
  channelId?: string
  channelThumbnail?: string
  publishedTimeText?: string
  publishedAt?: string
  length?: {
    simpleText: string
  }
  duration?: string
}

/*
Example video object from official API:
 {
    "id": "tbXlI4WpAJw",
    "title": "Lofi Zen - Calm Beats from a Trailer Balcony Above Neon City | For Study, Sleep, or Relaxation | 4K",
    "thumbnail": {
      "thumbnails": [
        {
          "url": "https://i.ytimg.com/vi/tbXlI4WpAJw/hqdefault.jpg",
          "width": 480,
          "height": 360
        }
      ]
    },
    "channelTitle": "Lofi Zen",
    "channelId": "UCWK2EvwgBDSJogxf8tAhuZQ",
    "publishedTimeText": "5 months ago",
    "publishedAt": "2025-07-27T17:55:41Z",
    "length": {
      "simpleText": "3:30:01"
    },
    "duration": "PT3H30M1S"
  }
*/

// Types for unofficial YouTube API video renderer
export type YouTubeUnofficialVideoRenderer = {
  videoId: string
  thumbnail: {
    thumbnails: Array<{
      url: string
      width: number
      height: number
    }>
  }
  title: {
    runs: Array<{
      text: string
    }>
    accessibility: {
      accessibilityData: {
        label: string
      }
    }
  }
  descriptionSnippet: {
    runs: Array<{
      text: string
    }>
  }
  publishedTimeText: {
    simpleText: string
  }
  lengthText: {
    accessibility: {
      accessibilityData: {
        label: string
      }
    }
    simpleText: string
  }
  viewCountText: {
    simpleText: string
  }
  navigationEndpoint: {
    clickTrackingParams: string
    commandMetadata: {
      webCommandMetadata: {
        url: string
        webPageType: string
        rootVe: number
      }
    }
    watchEndpoint: {
      videoId: string
      watchEndpointSupportedOnesieConfig: {
        html5PlaybackOnesieConfig: {
          commonConfig: {
            url: string
          }
        }
      }
    }
  }
  ownerBadges?: Array<{
    metadataBadgeRenderer: {
      icon: {
        iconType: string
      }
      style: string
      tooltip: string
      trackingParams: string
      accessibilityData: {
        label: string
      }
    }
  }>
  trackingParams: string
  showActionMenu: boolean
  shortViewCountText: {
    accessibility: {
      accessibilityData: {
        label: string
      }
    }
    simpleText: string
  }
  menu: {
    menuRenderer: {
      items: Array<{
        menuServiceItemRenderer?: {
          text: {
            runs: Array<{
              text: string
            }>
          }
          icon: {
            iconType: string
          }
          serviceEndpoint: {
            clickTrackingParams: string
            commandMetadata: {
              webCommandMetadata: {
                sendPost: boolean
                apiUrl?: string
              }
            }
            signalServiceEndpoint?: {
              signal: string
              actions: Array<{
                clickTrackingParams: string
                addToPlaylistCommand: {
                  openMiniplayer: boolean
                  videoId: string
                  listType: string
                  onCreateListCommand: {
                    clickTrackingParams: string
                    commandMetadata: {
                      webCommandMetadata: {
                        sendPost: boolean
                        apiUrl: string
                      }
                    }
                    createPlaylistServiceEndpoint: {
                      videoIds: string[]
                      params: string
                    }
                  }
                  videoIds: string[]
                  videoCommand?: {
                    clickTrackingParams: string
                    commandMetadata: {
                      webCommandMetadata: {
                        url: string
                        webPageType: string
                        rootVe: number
                      }
                    }
                    watchEndpoint: {
                      videoId: string
                      playerParams: string
                      watchEndpointSupportedOnesieConfig: {
                        html5PlaybackOnesieConfig: {
                          commonConfig: {
                            url: string
                          }
                        }
                      }
                    }
                  }
                }
              }>
            }
            shareEntityServiceEndpoint?: {
              serializedShareEntity: string
              commands: Array<{
                clickTrackingParams: string
                openPopupAction: {
                  popup: {
                    unifiedSharePanelRenderer: {
                      trackingParams: string
                      showLoadingSpinner: boolean
                    }
                  }
                  popupType: string
                  beReused: boolean
                }
              }>
            }
          }
          trackingParams: string
        }
        menuNavigationItemRenderer?: {
          text: {
            runs: Array<{
              text: string
            }>
          }
          icon: {
            iconType: string
          }
          navigationEndpoint: {
            clickTrackingParams: string
            commandMetadata: {
              webCommandMetadata: {
                url: string
                webPageType: string
                rootVe: number
              }
            }
            signInEndpoint: {
              nextEndpoint: {
                clickTrackingParams: string
                showSheetCommand: {
                  panelLoadingStrategy: {
                    requestTemplate: {
                      panelId: string
                      params: string
                    }
                  }
                }
              }
            }
          }
          trackingParams: string
        }
      }>
      trackingParams: string
      accessibility: {
        accessibilityData: {
          label: string
        }
      }
    }
  }
  thumbnailOverlays: Array<{
    thumbnailOverlayTimeStatusRenderer?: {
      text: {
        accessibility: {
          accessibilityData: {
            label: string
          }
        }
        simpleText: string
      }
      style: string
    }
    thumbnailOverlayToggleButtonRenderer?: {
      isToggled?: boolean
      untoggledIcon: {
        iconType: string
      }
      toggledIcon?: {
        iconType: string
      }
      untoggledTooltip: string
      toggledTooltip?: string
      untoggledServiceEndpoint: {
        clickTrackingParams: string
        commandMetadata: {
          webCommandMetadata: {
            sendPost: boolean
            apiUrl?: string
          }
        }
        playlistEditEndpoint?: {
          playlistId: string
          actions: Array<{
            addedVideoId?: string
            action: string
            removedVideoId?: string
          }>
        }
        signalServiceEndpoint?: {
          signal: string
          actions: Array<{
            clickTrackingParams: string
            addToPlaylistCommand: {
              openMiniplayer: boolean
              videoId: string
              listType: string
              onCreateListCommand: {
                clickTrackingParams: string
                commandMetadata: {
                  webCommandMetadata: {
                    sendPost: boolean
                    apiUrl: string
                  }
                }
                createPlaylistServiceEndpoint: {
                  videoIds: string[]
                  params: string
                }
              }
              videoIds: string[]
            }
          }>
        }
      }
      toggledServiceEndpoint?: {
        clickTrackingParams: string
        commandMetadata: {
          webCommandMetadata: {
            sendPost: boolean
            apiUrl: string
          }
        }
        playlistEditEndpoint: {
          playlistId: string
          actions: Array<{
            action: string
            removedVideoId: string
          }>
        }
      }
      untoggledAccessibility: {
        accessibilityData: {
          label: string
        }
      }
      toggledAccessibility?: {
        accessibilityData: {
          label: string
        }
      }
      trackingParams: string
    }
    thumbnailOverlayNowPlayingRenderer?: {
      text: {
        runs: Array<{
          text: string
        }>
      }
    }
  }>
}

/**
 * Validate API key is configured
 */
function validateApiKey(): { valid: boolean; error?: string } {
  if (!process.env.YOUTUBE_API_KEY) {
    return {
      valid: false,
      error: ERROR_MESSAGES.API_KEY_MISSING,
    }
  }
  return { valid: true }
}

/**
 * Format subscriber count for display
 */
function formatSubscriberCount(count: string | number | null | undefined): string | undefined {
  if (!count) return undefined
  const num = typeof count === "string" ? parseInt(count, 10) : count
  if (isNaN(num)) return undefined

  if (num >= SUBSCRIBER_THRESHOLDS.MILLION) {
    return `${(num / SUBSCRIBER_THRESHOLDS.MILLION).toFixed(1)}M subscribers`
  } else if (num >= SUBSCRIBER_THRESHOLDS.THOUSAND) {
    return `${(num / SUBSCRIBER_THRESHOLDS.THOUSAND).toFixed(1)}K subscribers`
  }
  return `${num} subscribers`
}

/**
 * Search for YouTube channels by query using official YouTube Data API v3
 */
export async function searchYouTubeChannels(
  query: string
): Promise<{ results: ChannelSearchResult[]; error?: string }> {
  const validation = validateApiKey()
  if (!validation.valid) {
    return { results: [], error: validation.error }
  }

  try {
    if (!query.trim()) {
      return { results: [] }
    }

    const response = await createYouTubeClient().search.list({
      part: [YOUTUBE_API_PARTS.SNIPPET],
      q: query,
      type: SEARCH_CONFIG.TYPE_CHANNEL,
      maxResults: SEARCH_CONFIG.MAX_RESULTS,
      order: SEARCH_CONFIG.ORDER_RELEVANCE,
    })

    if (!response.data.items) {
      return { results: [] }
    }

    // Get channel IDs to fetch detailed stats
    const channelIds = response.data.items
      .map((item) => item.snippet?.channelId)
      .filter((id): id is string => !!id)

    // Fetch channel details including subscriber counts
    const channelsResponse = await createYouTubeClient().channels.list({
      part: [YOUTUBE_API_PARTS.SNIPPET, YOUTUBE_API_PARTS.STATISTICS],
      id: channelIds,
    })

    const channels: ChannelSearchResult[] = (channelsResponse.data.items || []).map((item) => {
      const thumbnails = item.snippet?.thumbnails
      const thumbnailUrl =
        thumbnails?.high?.url ||
        thumbnails?.medium?.url ||
        thumbnails?.default?.url ||
        ""

      const subscriberCountRaw = item.statistics?.subscriberCount
        ? parseInt(item.statistics.subscriberCount as string, 10)
        : 0

      return {
        id: item.id!,
        title: item.snippet?.title || "",
        thumbnail: {
          thumbnails: [
            {
              url: thumbnailUrl,
              width: thumbnails?.high?.width || THUMBNAIL_DEFAULTS.HIGH_WIDTH,
              height: thumbnails?.high?.height || THUMBNAIL_DEFAULTS.HIGH_HEIGHT,
            },
          ],
        },
        customUrl: item.snippet?.customUrl || undefined,
        subscriberCount: formatSubscriberCount(item.statistics?.subscriberCount),
        subscriberCountRaw,
      }
    })

    return { results: channels }
  } catch (error) {
    console.error("YouTube channel search error:", error)
    return {
      results: [],
      error: ERROR_MESSAGES.SEARCH_FAILED,
    }
  }
}

/**
 * Get channel metadata by ID or handle using official YouTube Data API v3
 */
export async function getChannelById(
  channelIdOrHandle: string
): Promise<{ channel: ChannelSearchResult | null; error?: string }> {
  const validation = validateApiKey()
  if (!validation.valid) {
    return { channel: null, error: validation.error }
  }

  try {
    const channelId = channelIdOrHandle

    // If it's a handle (@username) or custom URL, search for it first
    if (channelIdOrHandle.startsWith("@") || !channelIdOrHandle.startsWith("UC")) {
      const { results } = await searchYouTubeChannels(channelIdOrHandle)
      if (results.length === 0) {
        return { channel: null, error: ERROR_MESSAGES.CHANNEL_NOT_FOUND }
      }
      // Use the first result
      return { channel: results[0] }
    }

    // Direct channel ID lookup
    const response = await createYouTubeClient().channels.list({
      part: ["snippet", "statistics"],
      id: [channelId],
    })

    if (!response.data.items || response.data.items.length === 0) {
      return { channel: null, error: ERROR_MESSAGES.CHANNEL_NOT_FOUND }
    }

    const item = response.data.items[0]
    const thumbnails = item.snippet?.thumbnails
    const thumbnailUrl =
      thumbnails?.high?.url ||
      thumbnails?.medium?.url ||
      thumbnails?.default?.url ||
      ""

    const subscriberCountRaw = item.statistics?.subscriberCount
      ? parseInt(item.statistics.subscriberCount as string, 10)
      : 0

    const channel: ChannelSearchResult = {
      id: item.id!,
      title: item.snippet?.title || "",
    thumbnail: {
      thumbnails: [
        {
          url: thumbnailUrl,
          width: thumbnails?.high?.width || THUMBNAIL_DEFAULTS.HIGH_WIDTH,
          height: thumbnails?.high?.height || THUMBNAIL_DEFAULTS.HIGH_HEIGHT,
        },
      ],
    },
      customUrl: item.snippet?.customUrl || undefined,
      subscriberCount: formatSubscriberCount(item.statistics?.subscriberCount),
      subscriberCountRaw,
    }

    return { channel }
  } catch (error) {
    console.error("Get channel error:", error)
    return { channel: null, error: ERROR_MESSAGES.FETCH_CHANNEL_FAILED }
  }
}

/**
 * Fetch latest videos from a YouTube channel using official YouTube Data API v3
 * Uses the channel's uploads playlist for accurate results
 */
export async function getChannelLatestVideos(
  channelId: string,
  channelTitle: string,
  limit: number = 10,
  channelThumbnail?: string
): Promise<{ results: ChannelVideoResult[]; error?: string }> {
  const validation = validateApiKey()
  if (!validation.valid) {
    return { results: [], error: validation.error }
  }

  console.log(`<LatestVideosFetch channelId="${channelId}" channelTitle="${channelTitle}" limit="${limit}" />`);

  if (!channelId.startsWith("UC") && !channelId.startsWith("@")) {
    return { results: [], error: `Invalid channel ID: ${channelId}` }
  }

  try {
    // First, get the channel's uploads playlist ID
    const channelResponse = await createYouTubeClient().channels.list({
      part: [YOUTUBE_API_PARTS.CONTENT_DETAILS],
      id: channelId.startsWith("UC") ? [channelId] : undefined,
      forHandle: channelId.startsWith("@") ? channelId : undefined,
    })

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return { results: [], error: ERROR_MESSAGES.CHANNEL_NOT_FOUND }
    }

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      return { results: [], error: ERROR_MESSAGES.UPLOADS_PLAYLIST_NOT_FOUND }
    }

    // Fetch videos from the uploads playlist (most recent first)
    const playlistResponse = await createYouTubeClient().playlistItems.list({
      part: [YOUTUBE_API_PARTS.SNIPPET, YOUTUBE_API_PARTS.CONTENT_DETAILS],
      playlistId: uploadsPlaylistId,
      maxResults: Math.min(limit, CHANNEL_CONFIG.UPLOADS_PLAYLIST_MAX_RESULTS), // Fetch extra to filter out shorts
    })

    if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
      return { results: [] }
    }

    // Get video IDs to fetch duration details
    const playlistVideoIds = playlistResponse.data.items
      .filter((item) => item.snippet?.resourceId?.kind === CHANNEL_CONFIG.VIDEO_RESOURCE_KIND)
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => !!id)

    if (playlistVideoIds.length === 0) {
      return { results: [] }
    }

    // Fetch video details including duration
    const videosResponse = await createYouTubeClient().videos.list({
      part: [YOUTUBE_API_PARTS.CONTENT_DETAILS, YOUTUBE_API_PARTS.SNIPPET],
      id: playlistVideoIds,
    })

    // Helper to parse ISO 8601 duration to seconds
    const parseDurationToSeconds = (isoDuration: string | null | undefined): number => {
      if (!isoDuration) return 0

      // Parse ISO 8601 duration (e.g., "PT3M45S")
      const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (!match) return 0

      const hours = parseInt(match[1] || "0", 10)
      const minutes = parseInt(match[2] || "0", 10)
      const seconds = parseInt(match[3] || "0", 10)

      return hours * TIME_UNITS.SECONDS_PER_HOUR + minutes * TIME_UNITS.SECONDS_PER_MINUTE + seconds
    }

    // Helper to format ISO 8601 duration to simple text (e.g., "3:45")
    const formatDuration = (isoDuration: string | null | undefined): string => {
      if (!isoDuration) return "0:00"

      // Parse ISO 8601 duration (e.g., "PT3M45S" -> "3:45")
      const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
      if (!match) return "0:00"

      const hours = parseInt(match[1] || "0", 10)
      const minutes = parseInt(match[2] || "0", 10)
      const seconds = parseInt(match[3] || "0", 10)

      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      }
      return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }

    // Helper to format relative time from published date
    const formatRelativeTime = (publishedAt: string | null | undefined): string => {
      if (!publishedAt) return ""

      const now = new Date()
      const published = new Date(publishedAt)
      const diffMs = now.getTime() - published.getTime()
      const diffSeconds = Math.floor(diffMs / 1000)
      const diffMinutes = Math.floor(diffSeconds / TIME_UNITS.SECONDS_PER_MINUTE)
      const diffHours = Math.floor(diffMinutes / TIME_UNITS.MINUTES_PER_HOUR)
      const diffDays = Math.floor(diffHours / TIME_UNITS.HOURS_PER_DAY)
      const diffWeeks = Math.floor(diffDays / TIME_UNITS.DAYS_PER_WEEK)
      const diffMonths = Math.floor(diffDays / TIME_UNITS.DAYS_PER_MONTH)
      const diffYears = Math.floor(diffDays / TIME_UNITS.DAYS_PER_YEAR)

      if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`
      if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`
      if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`
      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
      if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
      if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`
      return "Just now"
    }

    const videoById = new Map((videosResponse.data.items || []).map((item) => [item.id || "", item]))
    const videos: ChannelVideoResult[] = playlistVideoIds
      .map((id) => videoById.get(id))
      .filter((item): item is NonNullable<typeof item> => !!item)
      .filter((item) => parseDurationToSeconds(item.contentDetails?.duration) > CHANNEL_CONFIG.MIN_VIDEO_DURATION_SECONDS)
      .slice(0, limit)
      .map((item) => {
        const snippet = item.snippet
        const thumbnails = snippet?.thumbnails
        const thumbnailUrl =
          thumbnails?.high?.url ||
          thumbnails?.medium?.url ||
          thumbnails?.default?.url ||
          ""

        const duration = formatDuration(item.contentDetails?.duration)

        return {
          id: item.id!,
          title: snippet?.title || "",
          thumbnail: {
            thumbnails: [
              {
                url: thumbnailUrl,
                width: thumbnails?.high?.width || THUMBNAIL_DEFAULTS.MEDIUM_WIDTH,
                height: thumbnails?.high?.height || THUMBNAIL_DEFAULTS.MEDIUM_HEIGHT,
              },
            ],
          },
          channelTitle: snippet?.channelTitle || channelTitle,
          channelId: snippet?.channelId || channelId,
          channelThumbnail,
          publishedTimeText: formatRelativeTime(snippet?.publishedAt),
          publishedAt: snippet?.publishedAt || undefined,
          length: {
            simpleText: duration,
          },
          duration: item.contentDetails?.duration || undefined,
        }
      })

    return { results: videos }
  } catch (error) {
    console.error("Get channel videos error:", error)

    // console.log("url:", error?.config?.url);
    // console.log("params:", error?.config?.params);     // <-- key line
    // console.log("response data:", error?.response?.data);

    return {
      results: [],
      error: ERROR_MESSAGES.FETCH_VIDEOS_FAILED,
    }
  }
}

/**
 * Fetch latest video ID from a YouTube channel using unofficial YouTube API
 */
export async function getChannelLatestVideoIdUnofficial(
  channelId: string
): Promise<{ videos: YouTubeUnofficialVideoRenderer[]; error?: string }> {
  try {
    const url = channelId.startsWith("@")
      ? `${YOUTUBE_URLS.BASE}/${channelId}${YOUTUBE_URLS.VIDEOS_PATH}`
      : `${YOUTUBE_URLS.BASE}/${YOUTUBE_URLS.CHANNEL_PATH}${channelId}${YOUTUBE_URLS.VIDEOS_PATH}`;

    console.log(`[getChannelLatestVideoIdUnofficial] Fetching URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": HTTP_HEADERS.USER_AGENT,
        "Accept-Language": HTTP_HEADERS.ACCEPT_LANGUAGE,
      },
    });

    console.log(`[getChannelLatestVideoIdUnofficial] Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      return {
        videos: [],
        error: `${ERROR_MESSAGES.REQUEST_FAILED} ${response.status} ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Extract ytInitialData JSON block
    const extractJsonBlock = (html: string, marker: string): string => {
      const markerIndex = html.indexOf(marker);
      if (markerIndex === -1) {
        throw new Error(`Marker not found: ${marker}`);
      }

      const startIndex = html.indexOf("{", markerIndex);
      if (startIndex === -1) {
        throw new Error(`JSON start not found for: ${marker}`);
      }

      let depth = 0;
      let inString = false;
      let isEscaped = false;

      for (let i = startIndex; i < html.length; i += 1) {
        const char = html[i];

        if (inString) {
          if (isEscaped) {
            isEscaped = false;
          } else if (char === "\\") {
            isEscaped = true;
          } else if (char === '"') {
            inString = false;
          }
          continue;
        }

        if (char === '"') {
          inString = true;
          continue;
        }

        if (char === "{") {
          depth += 1;
        } else if (char === "}") {
          depth -= 1;
          if (depth === 0) {
            return html.slice(startIndex, i + 1);
          }
        }
      }

      throw new Error(`JSON end not found for: ${marker}`);
    };

    const initialDataJson = extractJsonBlock(html, JSON_MARKERS.YT_INITIAL_DATA);
    const initialData = JSON.parse(initialDataJson);

    const tabs = initialData?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
    const videosTab = tabs.find((tab: any) => {
      const renderer = tab?.tabRenderer;
      if (!renderer) return false;
      if (renderer.title === YOUTUBE_URLS.VIDEOS_TAB_TITLE) return true;
      return renderer.endpoint?.commandMetadata?.webCommandMetadata?.url?.includes(YOUTUBE_URLS.VIDEOS_PATH);
    });

    const gridItems =
      videosTab?.tabRenderer?.content?.richGridRenderer?.contents ?? [];

    const videos = gridItems
      .map((item: any) => item?.richItemRenderer?.content?.videoRenderer)
      .filter(Boolean)
      .filter((video: any) => video?.videoId);

    if (videos.length > 0) {
      return { videos };
    }

    return {
      videos: [],
      error: ERROR_MESSAGES.NO_VIDEOS_FOUND,
    };
  } catch (error) {
    console.error("Get channel latest video unofficial error:", error);
    return {
      videos: [],
      error:
        error instanceof Error ? error.message : ERROR_MESSAGES.FETCH_LATEST_VIDEO_FAILED,
    };
  }
}
