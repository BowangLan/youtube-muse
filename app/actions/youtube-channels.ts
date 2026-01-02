"use server"

import { api } from "@/convex/_generated/api"
import { fr } from "date-fns/locale"
import { google } from "googleapis"
import { query } from "@/convex/_generated/server"
import { convexClient } from "@/lib/convex-client"

// Create YouTube client function to avoid global state issues
const createYouTubeClient = () => google.youtube({
  version: "v3",
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
      error: "YouTube API key not configured. Please add YOUTUBE_API_KEY to your .env.local file.",
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

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M subscribers`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K subscribers`
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
      part: ["snippet"],
      q: query,
      type: ["channel"],
      maxResults: 20,
      order: "relevance",
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
      part: ["snippet", "statistics"],
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
              width: thumbnails?.high?.width || 800,
              height: thumbnails?.high?.height || 800,
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
      error: "Failed to search channels. Please check your API key and try again.",
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
        return { channel: null, error: "Channel not found" }
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
      return { channel: null, error: "Channel not found" }
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
            width: thumbnails?.high?.width || 800,
            height: thumbnails?.high?.height || 800,
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
    return { channel: null, error: "Failed to fetch channel info" }
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

  console.log(`[getChannelLatestVideos] Fetching videos for channel: ${channelId}`);

  if (!channelId.startsWith("UC") && !channelId.startsWith("@")) {
    return { results: [], error: `Invalid channel ID: ${channelId}` }
  }

  try {
    // First, get the channel's uploads playlist ID
    const channelResponse = await createYouTubeClient().channels.list({
      part: ["contentDetails"],
      id: channelId.startsWith("UC") ? [channelId] : undefined,
      forHandle: channelId.startsWith("@") ? channelId : undefined,
    })

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return { results: [], error: "Channel not found" }
    }

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      return { results: [], error: "Could not find uploads playlist" }
    }

    // Fetch videos from the uploads playlist (most recent first)
    const playlistResponse = await createYouTubeClient().playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults: Math.min(limit, 50), // Fetch extra to filter out shorts
    })

    if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
      return { results: [] }
    }

    // Get video IDs to fetch duration details
    const videoIds = playlistResponse.data.items
      .map((item) => item.contentDetails?.videoId)
      .filter((id): id is string => !!id)

    // Fetch video details including duration
    const videosResponse = await createYouTubeClient().videos.list({
      part: ["contentDetails", "snippet"],
      id: videoIds,
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

      return hours * 3600 + minutes * 60 + seconds
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
      const diffMinutes = Math.floor(diffSeconds / 60)
      const diffHours = Math.floor(diffMinutes / 60)
      const diffDays = Math.floor(diffHours / 24)
      const diffWeeks = Math.floor(diffDays / 7)
      const diffMonths = Math.floor(diffDays / 30)
      const diffYears = Math.floor(diffDays / 365)

      if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`
      if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`
      if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`
      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
      if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
      if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`
      return "Just now"
    }

    const videos: ChannelVideoResult[] = (videosResponse.data.items || [])
      .filter((item) => {
        // Filter out shorts (videos shorter than 4 minutes)
        const durationInSeconds = parseDurationToSeconds(item.contentDetails?.duration)
        return durationInSeconds >= 240 // 4 minutes in seconds
      })
      .slice(0, limit) // Limit to requested number
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
                width: thumbnails?.high?.width || 480,
                height: thumbnails?.high?.height || 360,
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
      error: "Failed to fetch channel videos. Please check your API key and try again.",
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
      ? `https://www.youtube.com/${channelId}/videos`
      : `https://www.youtube.com/channel/${channelId}/videos`;

    console.log(`[getChannelLatestVideoIdUnofficial] Fetching URL: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; YouTubeMuse/1.0; +https://example.com)",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    console.log(`[getChannelLatestVideoIdUnofficial] Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      return {
        videos: [],
        error: `Request failed: ${response.status} ${response.statusText}`,
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

    const initialDataJson = extractJsonBlock(html, "ytInitialData");
    const initialData = JSON.parse(initialDataJson);

    const tabs = initialData?.contents?.twoColumnBrowseResultsRenderer?.tabs ?? [];
    const videosTab = tabs.find((tab: any) => {
      const renderer = tab?.tabRenderer;
      if (!renderer) return false;
      if (renderer.title === "Videos") return true;
      return renderer.endpoint?.commandMetadata?.webCommandMetadata?.url?.includes("/videos");
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
      error: "No videos found for this channel",
    };
  } catch (error) {
    console.error("Get channel latest video unofficial error:", error);
    return {
      videos: [],
      error:
        error instanceof Error ? error.message : "Failed to fetch latest video",
    };
  }
}
