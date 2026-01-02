import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  channels: defineTable({
    channelId: v.string(),
    title: v.optional(v.string()),
    thumbnail: v.optional(
      v.array(v.object({
        url: v.string(),
        width: v.number(),
        height: v.number(),
      })),
    ),
    lastVideoId: v.optional(v.string()),
    lastSyncedAt: v.number(),
  }).index("by_channel_id", ["channelId"]),
  videos: defineTable({
    channelId: v.string(),
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
    createdAt: v.number(),
  })
    .index("by_channel_id", ["channelId"])
    .index("by_channel_video", ["channelId", "videoId"])
    .index("by_channel_published", ["channelId", "publishedAtMs"]),
})
