import { config } from 'dotenv';
import { google } from 'googleapis';

// Load environment variables from .env.local
config({ path: '.env.local' });

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

const channelHandle = "@LofiZenSpot";

/**
 * Validate API key is configured
 */
function validateApiKey() {
  if (!process.env.YOUTUBE_API_KEY) {
    return {
      valid: false,
      error: "YouTube API key not configured. Please add YOUTUBE_API_KEY to your .env.local file.",
    }
  }
  return { valid: true }
}

/**
 * Get channel metadata by ID or handle
 */
export async function getChannelById(channelIdOrHandle) {
  const validation = validateApiKey()
  if (!validation.valid) {
    return { channel: null, error: validation.error }
  }

  try {
    const channelId = channelIdOrHandle

    // If it's a handle (@username) or custom URL, search for it first
    if (channelIdOrHandle.startsWith("@") || !channelIdOrHandle.startsWith("UC")) {
      // For handles, we need to search
      const response = await youtube.search.list({
        part: ["snippet"],
        q: channelIdOrHandle,
        type: ["channel"],
        maxResults: 1,
      })

      if (!response.data.items || response.data.items.length === 0) {
        return { channel: null, error: "Channel not found" }
      }

      const item = response.data.items[0]
      const foundChannelId = item.snippet?.channelId

      if (!foundChannelId) {
        return { channel: null, error: "Channel ID not found" }
      }

      // Now get the full channel details
      const channelsResponse = await youtube.channels.list({
        part: ["snippet", "statistics"],
        id: [foundChannelId],
      })

      if (!channelsResponse.data.items || channelsResponse.data.items.length === 0) {
        return { channel: null, error: "Channel details not found" }
      }

      const channelItem = channelsResponse.data.items[0]
      const thumbnails = channelItem.snippet?.thumbnails
      const thumbnailUrl =
        thumbnails?.high?.url ||
        thumbnails?.medium?.url ||
        thumbnails?.default?.url ||
        ""

      const subscriberCountRaw = channelItem.statistics?.subscriberCount
        ? parseInt(channelItem.statistics.subscriberCount, 10)
        : 0

      const channel = {
        id: channelItem.id,
        title: channelItem.snippet?.title || "",
        thumbnail: {
          thumbnails: [
            {
              url: thumbnailUrl,
              width: thumbnails?.high?.width || 800,
              height: thumbnails?.high?.height || 800,
            },
          ],
        },
        customUrl: channelItem.snippet?.customUrl || undefined,
        subscriberCount: subscriberCountRaw > 0 ? `${subscriberCountRaw.toLocaleString()} subscribers` : undefined,
        subscriberCountRaw,
      }

      return { channel }
    }

    // Direct channel ID lookup
    const response = await youtube.channels.list({
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
      ? parseInt(item.statistics.subscriberCount, 10)
      : 0

    const channel = {
      id: item.id,
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
      subscriberCount: subscriberCountRaw > 0 ? `${subscriberCountRaw.toLocaleString()} subscribers` : undefined,
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
 */
export async function getChannelLatestVideos(
  channelId,
  channelTitle,
  limit = 10,
  channelThumbnail
) {
  const validation = validateApiKey()
  if (!validation.valid) {
    return { results: [], error: validation.error }
  }

  try {
    // First, get the channel's uploads playlist ID
    const channelResponse = await youtube.channels.list({
      part: ["contentDetails"],
      id: [channelId],
    })

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return { results: [], error: "Channel not found" }
    }

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      return { results: [], error: "Could not find uploads playlist" }
    }

    // Fetch videos from the uploads playlist (most recent first)
    const playlistResponse = await youtube.playlistItems.list({
      part: ["snippet", "contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults: Math.min(limit * 2, 50), // Fetch extra to filter out shorts
    })

    if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
      return { results: [] }
    }

    // Get video IDs to fetch duration details
    const videoIds = playlistResponse.data.items
      .map((item) => item.contentDetails?.videoId)
      .filter((id) => !!id)

    // Fetch video details including duration
    const videosResponse = await youtube.videos.list({
      part: ["contentDetails", "snippet"],
      id: videoIds,
    })

    // Helper to parse ISO 8601 duration to seconds
    const parseDurationToSeconds = (isoDuration) => {
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
    const formatDuration = (isoDuration) => {
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
    const formatRelativeTime = (publishedAt) => {
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

    const videos = (videosResponse.data.items || [])
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
          id: item.id,
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
    return {
      results: [],
      error: "Failed to fetch channel videos. Please check your API key and try again.",
    }
  }
}

async function testOfficialYouTubeAPI() {
  console.log(`Testing official YouTube API with channel: ${channelHandle}`);
  console.log(`YouTube API Key configured: ${process.env.YOUTUBE_API_KEY ? 'Yes' : 'No'}`);

  if (!process.env.YOUTUBE_API_KEY) {
    console.error("Please set YOUTUBE_API_KEY in your .env.local file");
    return;
  }

  // First, get channel info to get the channel ID and title
  console.log("\nGetting channel info...");
  const channelResult = await getChannelById(channelHandle);

  if (channelResult.error) {
    console.error("Error getting channel info:", channelResult.error);
    return;
  }

  if (!channelResult.channel) {
    console.error("Channel not found");
    return;
  }

  const { id: channelId, title: channelTitle } = channelResult.channel;
  console.log(`Found channel: ${channelTitle} (ID: ${channelId})`);

  // Now get the latest videos
  console.log("\nGetting latest videos...");
  const videosResult = await getChannelLatestVideos(channelId, channelTitle, 10);

  if (videosResult.error) {
    console.error("Error getting videos:", videosResult.error);
    return;
  }

  const { results: videos } = videosResult;
  console.log(`Found ${videos.length} videos`);

  console.log(JSON.stringify(videos, null, 2));
}

// Run the test
testOfficialYouTubeAPI().catch(console.error);
