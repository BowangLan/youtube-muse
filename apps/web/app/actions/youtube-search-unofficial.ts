"use server";

/**
 * YouTube Unofficial Search API - Server Actions
 *
 * Provides YouTube search functionality using web scraping instead of official API.
 * Supports filtering by content type (video/channel/playlist) and video duration.
 *
 * Usage Examples:
 *
 * // Search for videos
 * const result = await searchYouTubeUnofficial("lofi hip hop", "video");
 *
 * // Search for channels
 * const result = await searchYouTubeUnofficial("music", "channel");
 *
 * // Search for short videos (<4 minutes)
 * const result = await searchYouTubeUnofficial("music video", "video", "short");
 *
 * // Search for long videos (>20 minutes)
 * const result = await searchYouTubeUnofficial("documentary", "video", "long");
 */

// URL Constants
const YOUTUBE_URLS = {
  BASE: "https://www.youtube.com",
  RESULTS_PATH: "/results",
} as const;

// HTTP Headers
const HTTP_HEADERS = {
  USER_AGENT: "Mozilla/5.0 (compatible; YouTubeMuse/1.0; +https://example.com)",
  ACCEPT_LANGUAGE: "en-US,en;q=0.9",
} as const;

// JSON Parsing
const JSON_MARKERS = {
  YT_INITIAL_DATA: "ytInitialData",
} as const;

// Error Messages
const ERROR_MESSAGES = {
  REQUEST_FAILED: "Request failed:",
  NO_RESULTS_FOUND: "No search results found",
  SEARCH_FAILED: "Failed to search videos",
} as const;

// YouTube search filter parameters for different content types
const TYPE_FILTERS = {
  video: "EgIQAQ%3D%3D", // Videos only
  channel: "EgIQAg%3D%3D", // Channels only
  playlist: "EgIQAw%3D%3D", // Playlists only
  movie: "EgIQBA%3D%3D", // Movies only
} as const;

// YouTube duration filter parameters (only applies to videos)
export type DurationFilter = "short" | "long" | "any";

const DURATION_FILTER_OPTIONS: {
  value: DurationFilter;
  label: string;
  description: string;
}[] = [
  { value: "any", label: "Any", description: "No duration filter" },
  { value: "short", label: "Short", description: "Under 4 minutes" },
  { value: "long", label: "Long", description: "Over 20 minutes" },
];

const DURATION_FILTERS: Record<DurationFilter, string> = {
  short: "EgQQARAB", // Short videos (<4 minutes)
  long: "EgQQARAC", // Long videos (>20 minutes)
  any: "", // Any duration (no filter)
};

// Types for unofficial YouTube search API response structures
interface YouTubeSearchVideoRenderer {
  videoId: string;
  title: {
    runs: Array<{
      text: string;
    }>;
  };
  ownerText: {
    runs: Array<{
      text: string;
      navigationEndpoint?: {
        browseEndpoint?: {
          browseId?: string;
        };
      };
    }>;
  };
  publishedTimeText: {
    simpleText: string;
  };
  viewCountText: {
    simpleText: string;
  };
  lengthText: {
    simpleText: string;
  };
  thumbnail: {
    thumbnails: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  };
}

interface YouTubeSearchChannelRenderer {
  channelId: string;
  title: {
    simpleText: string;
  };
  navigationEndpoint?: {
    browseEndpoint?: {
      browseId?: string;
      canonicalBaseUrl?: string;
    };
  };
  descriptionSnippet?: {
    runs?: Array<{
      text: string;
    }>;
  };
  // Note: YouTube's API naming is confusing:
  // - subscriberCountText actually contains the HANDLE (e.g., "@t3dotgg")
  // - videoCountText actually contains the SUBSCRIBER COUNT (e.g., "500K subscribers")
  subscriberCountText?: {
    simpleText?: string;
  };
  videoCountText?: {
    simpleText?: string;
  };
  thumbnail: {
    thumbnails: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  };
}

interface YouTubeSearchPlaylistRenderer {
  playlistId: string;
  title: {
    simpleText: string;
  };
  ownerText: {
    runs: Array<{
      text: string;
      navigationEndpoint?: {
        browseEndpoint?: {
          browseId?: string;
        };
      };
    }>;
  };
  videoCount: string;
  thumbnails: Array<{
    thumbnails: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  }>;
}

interface YouTubeSearchInitialData {
  contents?: {
    twoColumnSearchResultsRenderer?: {
      primaryContents?: {
        sectionListRenderer?: {
          contents?: Array<{
            itemSectionRenderer?: {
              contents?: Array<{
                videoRenderer?: YouTubeSearchVideoRenderer;
                channelRenderer?: YouTubeSearchChannelRenderer;
                playlistRenderer?: YouTubeSearchPlaylistRenderer;
              }>;
            };
          }>;
        };
      };
    };
  };
}

// Return types
export type SearchVideoResult = {
  videoId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  publishedTime: string;
  viewCount: string;
  lengthText: string;
  thumbnail: string;
  url: string;
};

export type SearchChannelResult = {
  channelId: string;
  title: string;
  channelTitle: string;
  handle: string;
  customUrl: string;
  description: string;
  subscriberCount: string;
  thumbnail: string;
  url: string;
};

export type SearchPlaylistResult = {
  playlistId: string;
  title: string;
  channelTitle: string;
  channelId: string;
  videoCount: string;
  thumbnail: string;
  url: string;
};

export type SearchResult = SearchVideoResult | SearchChannelResult | SearchPlaylistResult;

/**
 * Extract JSON block from HTML using marker
 */
function extractJsonBlock(html: string, marker: string): string {
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
}

/**
 * Search YouTube using unofficial scraping API
 */
export async function searchYouTubeUnofficial(
  query: string,
  type: "video" | "channel" | "playlist" = "video",
  duration: "short" | "long" | "any" = "any"
): Promise<{ results: SearchResult[]; error?: string }> {
  try {
    if (!query.trim()) {
      return { results: [] };
    }

    // Build search parameters
    let spParam = TYPE_FILTERS[type] || TYPE_FILTERS.video;

    // Add duration filter for video searches
    if (type === "video" && duration !== "any") {
      const durationParam = DURATION_FILTERS[duration];
      if (durationParam) {
        spParam = spParam + durationParam;
      }
    }

    const url = `${YOUTUBE_URLS.BASE}${YOUTUBE_URLS.RESULTS_PATH}?search_query=${encodeURIComponent(query)}&sp=${spParam}`;

    // Fetch search results
    const response = await fetch(url, {
      headers: {
        "User-Agent": HTTP_HEADERS.USER_AGENT,
        "Accept-Language": HTTP_HEADERS.ACCEPT_LANGUAGE,
      },
    });

    if (!response.ok) {
      throw new Error(`${ERROR_MESSAGES.REQUEST_FAILED} ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const initialDataJson = extractJsonBlock(html, JSON_MARKERS.YT_INITIAL_DATA);
    const initialData: YouTubeSearchInitialData = JSON.parse(initialDataJson);

    // Extract search results
    const primaryContents = initialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ?? [];
    const results: SearchResult[] = [];

    // Process each section in the search results
    for (const section of primaryContents) {
      const items = section?.itemSectionRenderer?.contents ?? [];

      for (const item of items) {
        if (type === "video") {
          // Handle video results
          const videoRenderer = item?.videoRenderer;
          if (videoRenderer) {
            results.push({
              videoId: videoRenderer.videoId,
              title: videoRenderer.title?.runs?.[0]?.text ?? "",
              channelTitle: videoRenderer.ownerText?.runs?.[0]?.text ?? "",
              channelId:
                videoRenderer.ownerText?.runs?.[0]?.navigationEndpoint
                  ?.browseEndpoint?.browseId ?? "",
              publishedTime: videoRenderer.publishedTimeText?.simpleText ?? "",
              viewCount: videoRenderer.viewCountText?.simpleText ?? "",
              lengthText: videoRenderer.lengthText?.simpleText ?? "",
              thumbnail: videoRenderer.thumbnail?.thumbnails?.[0]?.url ?? "",
              url: `https://www.youtube.com/watch?v=${videoRenderer.videoId}`,
            } as SearchVideoResult);
          }
        } else if (type === "channel") {
          // Handle channel results
          const channelRenderer = item?.channelRenderer;
          if (channelRenderer) {
            // Get the best quality thumbnail
            const thumbnails = channelRenderer.thumbnail?.thumbnails ?? [];
            const bestThumbnail =
              thumbnails[thumbnails.length - 1]?.url ?? thumbnails[0]?.url ?? "";
            const thumbnailUrl = bestThumbnail.startsWith("//")
              ? `https:${bestThumbnail}`
              : bestThumbnail;

            // YouTube's confusing naming convention:
            // - subscriberCountText contains the HANDLE (e.g., "@t3dotgg")
            // - videoCountText contains the SUBSCRIBER COUNT (e.g., "500K subscribers")
            const handle = channelRenderer.subscriberCountText?.simpleText ?? "";
            const subscriberCount = channelRenderer.videoCountText?.simpleText ?? "";
            const customUrl =
              channelRenderer.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl ?? "";

            results.push({
              channelId: channelRenderer.channelId,
              title: channelRenderer.title?.simpleText ?? "",
              channelTitle: channelRenderer.title?.simpleText ?? "",
              handle,
              customUrl,
              description:
                channelRenderer.descriptionSnippet?.runs?.map((r) => r.text).join("") ?? "",
              subscriberCount,
              thumbnail: thumbnailUrl,
              url: `https://www.youtube.com/channel/${channelRenderer.channelId}`,
            } as SearchChannelResult);
          }
        } else if (type === "playlist") {
          // Handle playlist results
          const playlistRenderer = item?.playlistRenderer;
          if (playlistRenderer) {
            results.push({
              playlistId: playlistRenderer.playlistId,
              title: playlistRenderer.title?.simpleText ?? "",
              channelTitle: playlistRenderer.ownerText?.runs?.[0]?.text ?? "",
              channelId:
                playlistRenderer.ownerText?.runs?.[0]?.navigationEndpoint
                  ?.browseEndpoint?.browseId ?? "",
              videoCount: playlistRenderer.videoCount ?? "",
              thumbnail:
                playlistRenderer.thumbnails?.[0]?.thumbnails?.[0]?.url ?? "",
              url: `https://www.youtube.com/playlist?list=${playlistRenderer.playlistId}`,
            } as SearchPlaylistResult);
          }
        }
      }
    }

    return { results };
  } catch (error) {
    console.error("YouTube unofficial search error:", error);
    return {
      results: [],
      error: ERROR_MESSAGES.SEARCH_FAILED,
    };
  }
}

/**
 * Search YouTube specifically for channels using unofficial scraping API
 *
 * This is a dedicated channel search function with correct field mappings
 * based on YouTube's actual response structure.
 *
 * Usage:
 *   const result = await searchYouTubeChannels("lofi music");
 *   const result = await searchYouTubeChannels("tech reviews", 10);
 */
export async function searchYouTubeChannels(
  query: string,
  maxResults: number = 20
): Promise<{ results: SearchChannelResult[]; error?: string }> {
  try {
    if (!query.trim()) {
      return { results: [] };
    }

    const url = `${YOUTUBE_URLS.BASE}${YOUTUBE_URLS.RESULTS_PATH}?search_query=${encodeURIComponent(query)}&sp=${TYPE_FILTERS.channel}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": HTTP_HEADERS.USER_AGENT,
        "Accept-Language": HTTP_HEADERS.ACCEPT_LANGUAGE,
      },
    });

    if (!response.ok) {
      throw new Error(`${ERROR_MESSAGES.REQUEST_FAILED} ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const initialDataJson = extractJsonBlock(html, JSON_MARKERS.YT_INITIAL_DATA);
    const initialData: YouTubeSearchInitialData = JSON.parse(initialDataJson);

    const primaryContents =
      initialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents ?? [];

    const results: SearchChannelResult[] = [];

    for (const section of primaryContents) {
      const items = section?.itemSectionRenderer?.contents ?? [];

      for (const item of items) {
        const channelRenderer = item?.channelRenderer;
        if (channelRenderer) {
          // Get the best quality thumbnail (last one is usually highest res)
          const thumbnails = channelRenderer.thumbnail?.thumbnails ?? [];
          const bestThumbnail =
            thumbnails[thumbnails.length - 1]?.url ?? thumbnails[0]?.url ?? "";

          // Ensure thumbnail URL has protocol
          const thumbnailUrl = bestThumbnail.startsWith("//")
            ? `https:${bestThumbnail}`
            : bestThumbnail;

          // Extract custom URL from navigation endpoint (e.g., "/@t3dotgg")
          const customUrl =
            channelRenderer.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl ?? "";

          // YouTube's confusing naming convention:
          // - subscriberCountText.simpleText contains the HANDLE (e.g., "@t3dotgg")
          // - videoCountText.simpleText contains the SUBSCRIBER COUNT (e.g., "500K subscribers")
          const handle = channelRenderer.subscriberCountText?.simpleText ?? "";
          const subscriberCount = channelRenderer.videoCountText?.simpleText ?? "";

          // Description is in runs array
          const description =
            channelRenderer.descriptionSnippet?.runs?.map((r) => r.text).join("") ?? "";

          results.push({
            channelId: channelRenderer.channelId,
            title: channelRenderer.title?.simpleText ?? "",
            channelTitle: channelRenderer.title?.simpleText ?? "",
            handle,
            customUrl,
            description,
            subscriberCount,
            thumbnail: thumbnailUrl,
            url: `https://www.youtube.com/channel/${channelRenderer.channelId}`,
          });

          // Stop if we've reached max results
          if (results.length >= maxResults) {
            break;
          }
        }
      }

      if (results.length >= maxResults) {
        break;
      }
    }

    return { results };
  } catch (error) {
    console.error("YouTube channel search error:", error);
    return {
      results: [],
      error: "Failed to search channels",
    };
  }
}
