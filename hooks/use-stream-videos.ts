import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Stream } from "@/lib/types/stream"
import type { Track } from "@/lib/types/playlist"

// Transform database video to Track format
type StreamVideo = {
  videoId: string
  title: string
  channelId: string
  channelTitle?: string
  channelThumbnailUrl?: string
  duration?: number
  thumbnailUrl?: string
  publishedAt?: string
  publishedAtMs?: number
}

function transformVideoToTrack(video: StreamVideo): Track {
  return {
    id: video.videoId,
    title: video.title,
    author: video.channelTitle || "Unknown Channel",
    authorUrl: `https://www.youtube.com/channel/${video.channelId}`,
    authorThumbnail: video.channelThumbnailUrl,
    duration: video.duration ?? 0,
    thumbnailUrl: video.thumbnailUrl || "",
    addedAt: video.publishedAtMs || Date.now(),
    publishedAt: video.publishedAt,
  }
}

export function useStreamVideos(stream: Stream) {
  const channelIds = stream.channels.map(channel => channel.id)

  const videos = useQuery(
    api.channelVideos.getLatestVideosByChannelIds,
    channelIds.length > 0
      ? {
        channelIds,
        limit: stream.trackLimit,
      }
      : "skip"
  )

  const tracks = videos ? videos.map(transformVideoToTrack) : []

  return {
    tracks,
    isLoading: videos === undefined
  }
}
