import { action, mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { fetchLatestVideoIds } from "./youtubeUnofficial"
import { api } from "./_generated/api"

type OfficialVideo = {
  videoId: string
  title: string
  url: string
  publishedAt?: string
  publishedAtMs?: number
  thumbnailUrl?: string
  duration?: string
  viewCount?: string
  channelTitle?: string
  channelThumbnailUrl?: string
  thumbnail?: Array<{
    url: string
    width: number
    height: number
  }>
}

const fetchOfficialVideoDetails = async (videoIds: string[], apiKey: string) => {
  if (videoIds.length === 0) return []

  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    id: videoIds.join(","),
    key: apiKey,
  })

  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?${params}`)

  if (!response.ok) {
    throw new Error(`YouTube Data API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const items = Array.isArray(data.items) ? data.items : []

  return items.map((item: { id: string; snippet?: { title?: string; publishedAt?: string; thumbnails?: { [key: string]: { url?: string; width?: number; height?: number } }; channelTitle?: string }; contentDetails?: { duration?: string }; statistics?: { viewCount?: string } }) => {
    const publishedAt = item.snippet?.publishedAt
    const thumbnails = item.snippet?.thumbnails

    // Convert YouTube thumbnails to our format
    const thumbnailArray = thumbnails ? Object.entries(thumbnails)
      .filter(([, thumb]) => thumb?.url)
      .map(([, thumb]) => ({
        url: thumb!.url!,
        width: thumb!.width ?? 0,
        height: thumb!.height ?? 0,
      })) : []

    return {
      videoId: item.id,
      title: item.snippet?.title ?? "",
      url: `https://www.youtube.com/watch?v=${item.id}`,
      publishedAt,
      publishedAtMs: publishedAt ? Date.parse(publishedAt) : undefined,
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ??
        item.snippet?.thumbnails?.medium?.url,
      duration: item.contentDetails?.duration,
      viewCount: item.statistics?.viewCount,
      channelTitle: item.snippet?.channelTitle,
      thumbnail: thumbnailArray.length > 0 ? thumbnailArray : undefined,
    }
  })
}

export const getChannelVideos = query({
  args: {
    channelId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 30
    return ctx.db
      .query("videos")
      .withIndex("by_channel_published", (q) => q.eq("channelId", args.channelId))
      .order("desc")
      .take(limit)
  },
})

const MAX_VIDEOS_PER_CHANNEL = 30

export const getLatestVideosByChannelIds = query({
  args: {
    channelIds: v.array(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, MAX_VIDEOS_PER_CHANNEL) // Cap at 30 videos
    const videosPerChannel = Math.ceil(limit / args.channelIds.length) + 5 // Get a bit more per channel to ensure we have enough after sorting

    // Get latest videos from each channel
    const channelPromises = args.channelIds.map(channelId =>
      ctx.db
        .query("videos")
        .withIndex("by_channel_published", (q) => q.eq("channelId", channelId))
        .order("desc")
        .take(videosPerChannel)
    )

    const channelResults = await Promise.all(channelPromises)

    // Merge all videos and sort by publishedAtMs desc
    const allVideos = channelResults
      .flat()
      .filter(video => video.publishedAtMs) // Only include videos with publish time
      .sort((a, b) => (b.publishedAtMs ?? 0) - (a.publishedAtMs ?? 0))
      .slice(0, limit) // Take only the first N items

    return allVideos
  },
})

export const getChannelState = query({
  args: { channelId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("channels")
      .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
      .unique()
  },
})

export const updateChannelState = mutation({
  args: {
    channelId: v.string(),
    lastVideoId: v.optional(v.string()),
    title: v.optional(v.string()),
    thumbnail: v.optional(
      v.array(v.object({
        url: v.string(),
        width: v.number(),
        height: v.number(),
      })),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("channels")
      .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
      .unique()

    const payload = {
      lastVideoId: args.lastVideoId,
      lastSyncedAt: Date.now(),
      title: args.title ?? existing?.title,
      thumbnail: args.thumbnail ?? existing?.thumbnail,
    }

    if (existing) {
      await ctx.db.patch(existing._id, payload)
      return existing._id
    }

    return ctx.db.insert("channels", {
      channelId: args.channelId,
      ...payload,
    })
  },
})

export const upsertVideos = mutation({
  args: {
    channelId: v.string(),
    latestVideoId: v.string(),
    channelTitle: v.optional(v.string()),
    thumbnail: v.optional(
      v.array(v.object({
        url: v.string(),
        width: v.number(),
        height: v.number(),
      })),
    ),
    videos: v.array(
      v.object({
        videoId: v.string(),
        title: v.string(),
        url: v.string(),
        publishedAt: v.optional(v.string()),
        publishedAtMs: v.optional(v.number()),
        thumbnailUrl: v.optional(v.string()),
        duration: v.optional(v.number()),
        viewCount: v.optional(v.string()),
        channelTitle: v.optional(v.string()),
        channelThumbnailUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existingChannel = await ctx.db
      .query("channels")
      .withIndex("by_channel_id", (q) => q.eq("channelId", args.channelId))
      .unique()

    const channelPayload = {
      lastVideoId: args.latestVideoId,
      lastSyncedAt: Date.now(),
      title: args.channelTitle ?? existingChannel?.title,
      thumbnail: args.thumbnail ?? existingChannel?.thumbnail,
    }

    if (existingChannel) {
      await ctx.db.patch(existingChannel._id, channelPayload)
    } else {
      await ctx.db.insert("channels", {
        channelId: args.channelId,
        ...channelPayload,
      })
    }

    for (const video of args.videos) {
      const existing = await ctx.db
        .query("videos")
        .withIndex("by_channel_video", (q) =>
          q.eq("channelId", args.channelId).eq("videoId", video.videoId)
        )
        .unique()

      const payload = {
        channelId: args.channelId,
        videoId: video.videoId,
        title: video.title,
        url: video.url,
        publishedAt: video.publishedAt,
        publishedAtMs: video.publishedAtMs,
        thumbnailUrl: video.thumbnailUrl,
        duration: video.duration,
        viewCount: video.viewCount,
        channelTitle: video.channelTitle,
        channelThumbnailUrl: video.channelThumbnailUrl,
        createdAt: existing?.createdAt ?? Date.now(),
      }

      if (existing) {
        await ctx.db.patch(existing._id, payload)
      } else {
        await ctx.db.insert("videos", payload)
      }
    }
  },
})
