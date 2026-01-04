"use server"

import { api } from "@/convex/_generated/api"
import { convexClient } from "@/lib/convex-client"
import { getChannelById, getChannelLatestVideos } from "./youtube-channels-official"
import { getChannelLatestVideoIdUnofficial } from "./youtube-channels-unofficial"

const syncIntervalMs = 2 * 60 * 1000 // 2 minutes

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

async function syncChannelDetails(channelId: string): Promise<{ success: boolean; channelTitle?: string; message?: string }> {
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

  return { success: true, channelTitle: channel.channel.title }
}

export async function syncChannelLatestVideo(channelId: string, limit: number) {
  // Helper to parse ISO 8601 duration to seconds
  // get the latest video id from the channel
  const result = await getChannelLatestVideoIdUnofficial(channelId);
  if (result.error) {
    console.error("error", result.error);
    return { success: false, message: `Failed to fetch latest video id for channel ${channelId}: ${result.error}` };
  }

  console.log(`[syncChannelLatestVideo] Unofficial latest:\n\t<Video id="${result.videos[0].videoId}" title="${result.videos[0].title.runs[0].text}" />`);

  if (result.videos.length === 0) {
    console.error(`[syncChannelLatestVideo] No videos found for channel ${channelId}`);
    return { success: false, message: `No videos found for channel ${channelId}` };
  }

  const latestVideoId = result.videos[0].videoId;

  // get channel state which include the latest video id
  const channelState = await convexClient.query(api.channelVideos.getChannelState, {
    channelId: channelId,
  })

  const convexLatestVideoId = channelState?.lastVideoId;
  const convexLatestVideoTitle = channelState?.lastVideoTitle;
  console.log(`[syncChannelLatestVideo] Convex latest:\n\t<Video id="${convexLatestVideoId}" title="${convexLatestVideoTitle}" />`);

  if (channelState?.lastSyncedAt
    && Date.now() - channelState.lastSyncedAt < syncIntervalMs
    && channelState.totalVideos >= limit
  ) {
    // skip sync if the channel was recently synced
    return { success: true, message: `Skipped sync for channel ${channelId} (recently synced)` }
  }

  if (!channelState?.lastVideoId || channelState.lastVideoId !== latestVideoId
    // total video count check
    || channelState.totalVideos < limit
  ) {
    // update the channel state by upserting the videos using the Official API

    let channelTitle = channelState?.title;
    if (!channelState?.title || !channelState?.thumbnail) {
      const channelDetailsResult = await syncChannelDetails(channelId);
      if (!channelDetailsResult.success) {
        console.error("[syncChannelLatestVideo] Failed to sync channel details", channelDetailsResult.message);
        return { success: false, message: channelDetailsResult.message };
      }
      channelTitle = channelDetailsResult.channelTitle!
    }

    let videosToFetch = limit
    if (channelState?.lastVideoId && channelState.totalVideos >= limit) {
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
