"use server"

import { api } from "@/convex/_generated/api"
import { convexClient } from "@/lib/convex-client"
import { getChannelById, getChannelLatestVideoIdUnofficial, getChannelLatestVideos } from "./youtube-channels"

const syncIntervalMs = 2 * 60 * 1000 // 2 minutes

export async function syncChannelLatestVideo(channelId: string, limit: number) {
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

  // get the latest video id from the channel
  const result = await getChannelLatestVideoIdUnofficial(channelId);
  if (result.error) {
    console.error("error", result.error);
    return { success: false, message: `Failed to fetch latest video id for channel ${channelId}: ${result.error}` };
  }

  if (result.videos.length === 0) {
    console.error("No videos found for this channel");
    return { success: false, message: `No videos found for channel ${channelId}` };
  }

  const latestVideoId = result.videos[0].videoId;

  // get channel state which include the latest video id
  const channelState = await convexClient.query(api.channelVideos.getChannelState, {
    channelId: channelId,
  })

  if (channelState?.lastSyncedAt && Date.now() - channelState.lastSyncedAt < syncIntervalMs) {
    return { success: true, message: `Skipped sync for channel ${channelId} (recently synced)` }
  }

  if (!channelState?.lastVideoId || channelState.lastVideoId !== latestVideoId) {
    // update the channel state by upserting the videos using the Official API
    let channelTitle = channelState?.title

    if (!channelState?.title || !channelState?.thumbnail) {
      // sync channel detail
      const channel = await getChannelById(channelId);

      if (channel.error || !channel.channel) {
        console.error("error", channel.error);
        return { success: false, message: `Failed to fetch channel for channel ${channelId}: ${channel.error}` };
      }

      await convexClient.mutation(api.channelVideos.updateChannelState, {
        channelId: channelId,
        title: channel.channel.title,
        thumbnail: channel.channel.thumbnail.thumbnails
      })

      channelTitle = channel.channel.title
    }

    let videosToFetch = limit
    if (channelState?.lastVideoId) {
      const offset = result.videos.findIndex((v) => v.videoId === channelState.lastVideoId)
      videosToFetch = offset >= 0 ? offset : limit
    }

    if (videosToFetch <= 0) {
      await convexClient.mutation(api.channelVideos.updateChannelState, {
        channelId: channelId,
        lastVideoId: latestVideoId,
      })

      return { success: true, message: `No new videos for channel ${channelId}` }
    }

    // now do the actual sync of the latest video
    const videos = await getChannelLatestVideos(channelId, channelTitle!, videosToFetch)
    if (videos.error) {
      console.error("error", videos.error);
      return { success: false, message: `Failed to fetch videos for channel ${channelId}: ${videos.error}` };
    }

    await convexClient.mutation(api.channelVideos.upsertVideos, {
      channelId: channelId,
      latestVideoId: latestVideoId,
      videos: videos.results.map((v) => ({
        videoId: v.id,
        title: v.title,
        url: `https://www.youtube.com/watch?v=${v.id}`,
        publishedAt: v.publishedTimeText,
        publishedAtMs: v.publishedAt ? new Date(v.publishedAt).getTime() : undefined,
        thumbnailUrl: v.thumbnail?.thumbnails[0]?.url,
        duration: v.duration ? parseDurationToSeconds(v.duration) : undefined,
        channelTitle: v.channelTitle,
        channelThumbnailUrl: v.channelThumbnail,
      })),
    })

    return { success: true, message: `Synced ${videos.results.length} videos for channel ${channelId}` };
  }
}
