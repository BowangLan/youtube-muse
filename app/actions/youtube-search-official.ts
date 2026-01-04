"use server";

import { google } from "googleapis";

// Create YouTube client function to avoid global state issues
const createYouTubeClient = () => google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

export type SearchResult = {
  id: string;
  title: string;
  thumbnail: {
    thumbnails: Array<{ url: string; width: number; height: number }>;
  };
  channelTitle: string;
  channelId?: string;
  channelThumbnail?: string;
  publishedTimeText?: string;
  publishedAt?: string;
  length?: {
    simpleText: string;
  };
};

/**
 * Validate API key is configured
 */
function validateApiKey(): { valid: boolean; error?: string } {
  if (!process.env.YOUTUBE_API_KEY) {
    return {
      valid: false,
      error: "YouTube API key not configured. Please add YOUTUBE_API_KEY to your .env.local file.",
    };
  }
  return { valid: true };
}

/**
 * Helper to format relative time from published date
 */
const formatRelativeTime = (publishedAt: string | null | undefined): string => {
  if (!publishedAt) return "";

  const now = new Date();
  const published = new Date(publishedAt);
  const diffMs = now.getTime() - published.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffYears > 0) return `${diffYears} year${diffYears > 1 ? "s" : ""} ago`;
  if (diffMonths > 0) return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  if (diffWeeks > 0) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  return "Just now";
};

/**
 * Search YouTube videos using official YouTube Data API v3
 */
export async function searchYouTubeVideos(
  query: string,
  type: "video" | "channel" | "playlist" | "movie" = "video",
  options?: {
    minDurationMinutes?: number; // Minimum duration in minutes
    order?: "date" | "rating" | "relevance" | "title" | "videoCount" | "viewCount"; // Sort order
    maxResults?: number; // Maximum number of results (default 10)
  }
): Promise<{ results: SearchResult[]; error?: string }> {
  const validation = validateApiKey();
  if (!validation.valid) {
    return { results: [], error: validation.error };
  }

  try {
    if (!query.trim()) {
      return { results: [] };
    }

    const maxResults = options?.maxResults ?? 10;
    const order = options?.order ?? "relevance";

    // Search for videos
    const searchResponse = await createYouTubeClient().search.list({
      part: ["snippet"],
      q: query,
      type: [type],
      maxResults: options?.minDurationMinutes ? 50 : maxResults, // Fetch more if filtering by duration
      videoDuration: type === "video" ? "long" : undefined, // 'long' = >20 minutes
      order,
    });

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return { results: [] };
    }

    // Get video IDs to fetch duration details (only for videos)
    if (type === "video") {
      const videoIds = searchResponse.data.items
        .map((item) => item.id?.videoId)
        .filter((id): id is string => !!id);

      // Fetch video details including duration
      const videosResponse = await createYouTubeClient().videos.list({
        part: ["contentDetails", "snippet"],
        id: videoIds,
      });

      // Get unique channel IDs to fetch channel thumbnails
      const channelIds = Array.from(
        new Set(
          (videosResponse.data.items || [])
            .map((item) => item.snippet?.channelId)
            .filter((id): id is string => !!id)
        )
      );

      // Fetch channel details to get channel thumbnails
      const channelsResponse = await createYouTubeClient().channels.list({
        part: ["snippet"],
        id: channelIds,
      });

      // Create a map of channelId -> channelThumbnail
      const channelThumbnailMap = new Map<string, string>();
      (channelsResponse.data.items || []).forEach((channel) => {
        if (channel.id && channel.snippet?.thumbnails) {
          const thumbnails = channel.snippet.thumbnails;
          const thumbnailUrl =
            thumbnails.high?.url ||
            thumbnails.medium?.url ||
            thumbnails.default?.url ||
            "";
          channelThumbnailMap.set(channel.id, thumbnailUrl);
        }
      });

      // Helper to parse ISO 8601 duration to seconds
      const parseDurationToSeconds = (isoDuration: string | null | undefined): number => {
        if (!isoDuration) return 0;

        // Parse ISO 8601 duration (e.g., "PT3M45S")
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return 0;

        const hours = parseInt(match[1] || "0", 10);
        const minutes = parseInt(match[2] || "0", 10);
        const seconds = parseInt(match[3] || "0", 10);

        return hours * 3600 + minutes * 60 + seconds;
      };

      // Helper to format ISO 8601 duration to simple text (e.g., "3:45")
      const formatDuration = (isoDuration: string | null | undefined): string => {
        if (!isoDuration) return "0:00";

        // Parse ISO 8601 duration (e.g., "PT3M45S" -> "3:45")
        const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return "0:00";

        const hours = parseInt(match[1] || "0", 10);
        const minutes = parseInt(match[2] || "0", 10);
        const seconds = parseInt(match[3] || "0", 10);

        if (hours > 0) {
          return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
      };

      // Filter by minimum duration if specified
      const minDurationSeconds = options?.minDurationMinutes ? options.minDurationMinutes * 60 : 0;
      const filteredVideos = (videosResponse.data.items || []).filter((item) => {
        if (!minDurationSeconds) return true;
        const durationInSeconds = parseDurationToSeconds(item.contentDetails?.duration);
        return durationInSeconds >= minDurationSeconds;
      });

      const formattedResults: SearchResult[] = filteredVideos.slice(0, maxResults).map((item) => {
        const snippet = item.snippet;
        const thumbnails = snippet?.thumbnails;
        const thumbnailUrl =
          thumbnails?.high?.url ||
          thumbnails?.medium?.url ||
          thumbnails?.default?.url ||
          "";

        const duration = formatDuration(item.contentDetails?.duration);
        const channelId = snippet?.channelId || undefined;

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
          channelTitle: snippet?.channelTitle || "",
          channelId,
          channelThumbnail: channelId ? channelThumbnailMap.get(channelId) : undefined,
          publishedTimeText: formatRelativeTime(snippet?.publishedAt),
          publishedAt: snippet?.publishedAt || undefined,
          length: {
            simpleText: duration,
          },
        };
      });

      return { results: formattedResults };
    }

    // For non-video types, just return the search results
    const formattedResults: SearchResult[] = searchResponse.data.items.map((item) => {
      const snippet = item.snippet;
      const thumbnails = snippet?.thumbnails;
      const thumbnailUrl =
        thumbnails?.high?.url ||
        thumbnails?.medium?.url ||
        thumbnails?.default?.url ||
        "";

      return {
        id: item.id?.videoId || item.id?.channelId || item.id?.playlistId || "",
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
        channelTitle: snippet?.channelTitle || "",
      };
    });

    return { results: formattedResults };
  } catch (error) {
    console.error("YouTube search error:", error);
    return {
      results: [],
      error: "Failed to search videos. Please check your API key and try again.",
    };
  }
}
