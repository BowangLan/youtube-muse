"use server"

import YoutubeSearchApi from "youtube-search-api"

export type ChannelSearchResult = {
  id: string
  title: string
  thumbnail: {
    thumbnails: Array<{ url: string; width: number; height: number }>
  }
  customUrl?: string
  subscriberCount?: string
}

export type ChannelVideoResult = {
  id: string
  title: string
  thumbnail: {
    thumbnails: Array<{ url: string; width: number; height: number }>
  }
  channelTitle: string
  channelId?: string
  publishedTimeText?: string
  length?: {
    simpleText: string
  }
}

/**
 * Search for YouTube channels by query
 */
export async function searchYouTubeChannels(
  query: string
): Promise<{ results: ChannelSearchResult[]; error?: string }> {
  try {
    if (!query.trim()) {
      return { results: [] }
    }

    const result = await YoutubeSearchApi.GetListByKeyword(query, false, 10, [
      { type: "channel" },
    ])

    const channels: ChannelSearchResult[] = result.items.map((item: any) => ({
      id: item.channelId || item.id,
      title: item.title,
      thumbnail: item.thumbnail,
      customUrl: item.customUrl,
      subscriberCount: item.subscriberCount,
    }))

    return { results: channels }
  } catch (error) {
    console.error("YouTube channel search error:", error)
    return {
      results: [],
      error: "Failed to search channels. Please try again.",
    }
  }
}

/**
 * Get channel metadata by ID or handle
 * Uses search API to resolve handle to channel ID and get metadata
 */
export async function getChannelById(
  channelIdOrHandle: string
): Promise<{ channel: ChannelSearchResult | null; error?: string }> {
  try {
    // If it's a handle (@username), search for it
    const searchQuery = channelIdOrHandle.startsWith("@")
      ? channelIdOrHandle
      : channelIdOrHandle

    const { results } = await searchYouTubeChannels(searchQuery)

    // Return first exact match
    const channel = results.find(
      (ch) =>
        ch.id === channelIdOrHandle ||
        ch.customUrl === channelIdOrHandle ||
        ch.title.toLowerCase() === searchQuery.toLowerCase()
    )

    return { channel: channel || null }
  } catch (error) {
    console.error("Get channel error:", error)
    return { channel: null, error: "Failed to fetch channel info" }
  }
}

/**
 * Fetch latest videos from a YouTube channel
 * Note: youtube-search-api doesn't have direct channel uploads endpoint
 * Workaround: Search for channel-related content and filter by channel
 */
export async function getChannelLatestVideos(
  channelId: string,
  channelTitle: string,
  limit: number = 10
): Promise<{ results: ChannelVideoResult[]; error?: string }> {
  try {
    // Strategy: Search for channel name + music, then filter/sort
    const searchQuery = `${channelTitle} music`

    // Fetch more than needed to account for filtering
    const result = await YoutubeSearchApi.GetListByKeyword(
      searchQuery,
      false,
      Math.min(limit * 3, 50), // Fetch 3x to account for filtering, max 50
      [{ type: "video" }]
    )

    // Filter videos from this specific channel and exclude shorts
    const channelVideos = result.items
      .filter((item: any) => {
        if (item.type !== "video") return false
        if (item.isShort === true) return false
        // Check if video is from the target channel (loose match on channel title)
        return (
          item.channelTitle?.toLowerCase().includes(channelTitle.toLowerCase()) ||
          item.channelId === channelId
        )
      })
      .slice(0, limit) // Take only requested limit
      .map((item: any) => ({
        id: item.id,
        title: item.title,
        thumbnail: item.thumbnail,
        channelTitle: item.channelTitle,
        channelId: item.channelId,
        publishedTimeText: item.publishedTimeText,
        length: item.length,
      }))

    return { results: channelVideos }
  } catch (error) {
    console.error("Get channel videos error:", error)
    return {
      results: [],
      error: "Failed to fetch channel videos",
    }
  }
}
