import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import { GRADIENT_CLASS_NAMES } from "@/lib/intents"
import type { Stream, Channel } from "@/lib/types/stream"
import type { Track } from "@/lib/types/playlist"
import type { ChannelVideoResult } from "@/app/actions/youtube-channels"
import { usePlaylistStore } from "./playlist-store"

// Available gradient classes for streams (gradients 7-22, excluding built-in 1-6)
const CUSTOM_STREAM_GRADIENTS = GRADIENT_CLASS_NAMES.slice(6)

interface StreamsState {
  streams: Stream[]
}

interface StreamsActions {
  // CRUD operations
  createStream: (
    stream: Omit<Stream, "id" | "createdAt" | "updatedAt" | "lastRefreshedAt" | "gradientClassName">
  ) => Stream
  updateStream: (
    id: string,
    updates: Partial<Pick<Stream, "name" | "description" | "channels" | "trackLimit" | "gradientClassName">>
  ) => void
  deleteStream: (id: string) => void
  getStream: (id: string) => Stream | undefined
  getStreamByPlaylistId: (playlistId: string) => Stream | undefined

  // Channel management
  addChannelToStream: (streamId: string, channel: Channel) => void
  removeChannelFromStream: (streamId: string, channelId: string) => void

  // Refresh tracking
  updateLastRefreshed: (streamId: string) => void

  // Bulk operations
  refreshAllStreams: () => Promise<void>
  refreshStream: (streamId: string) => Promise<void>
}

const generateId = () => {
  return `stream-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export const useStreamsStore = create<StreamsState & StreamsActions>()(
  persist(
    (set, get) => ({
      streams: [],

      createStream: (streamData) => {
        const state = get()
        const gradientIndex = state.streams.length % CUSTOM_STREAM_GRADIENTS.length
        const now = Date.now()
        const newStream: Stream = {
          ...streamData,
          id: generateId(),
          gradientClassName: CUSTOM_STREAM_GRADIENTS[gradientIndex],
          createdAt: now,
          updatedAt: now,
          lastRefreshedAt: now,
        }

        set((state) => ({
          streams: [...state.streams, newStream],
        }))

        return newStream
      },

      updateStream: (id, updates) => {
        set((state) => ({
          streams: state.streams.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          ),
        }))
      },

      deleteStream: (id) => {
        const stream = get().getStream(id)
        if (stream) {
          // Delete associated playlist
          usePlaylistStore.getState().deletePlaylist(stream.playlistId)
        }

        set((state) => ({
          streams: state.streams.filter((s) => s.id !== id),
        }))
      },

      getStream: (id) => {
        return get().streams.find((s) => s.id === id)
      },

      getStreamByPlaylistId: (playlistId) => {
        return get().streams.find((s) => s.playlistId === playlistId)
      },

      addChannelToStream: (streamId, channel) => {
        set((state) => ({
          streams: state.streams.map((s) =>
            s.id === streamId
              ? {
                ...s,
                channels: [...s.channels, channel],
                updatedAt: Date.now(),
              }
              : s
          ),
        }))
      },

      removeChannelFromStream: (streamId, channelId) => {
        set((state) => ({
          streams: state.streams.map((s) =>
            s.id === streamId
              ? {
                ...s,
                channels: s.channels.filter((c) => c.id !== channelId),
                updatedAt: Date.now(),
              }
              : s
          ),
        }))
      },

      updateLastRefreshed: (streamId) => {
        set((state) => ({
          streams: state.streams.map((s) =>
            s.id === streamId ? { ...s, lastRefreshedAt: Date.now() } : s
          ),
        }))
      },

      refreshAllStreams: async () => {
        const { streams, refreshStream } = get()

        // Refresh all streams in parallel
        await Promise.all(
          streams.map((stream) =>
            refreshStream(stream.id).catch((error) => {
              console.error(`Failed to refresh stream ${stream.id}:`, error)
            })
          )
        )
      },

      refreshStream: async (streamId) => {
        const stream = get().getStream(streamId)
        if (!stream || stream.channels.length === 0) {
          return
        }

        try {
          // Import server action dynamically to avoid circular dependency
          const { getChannelLatestVideos } = await import("@/app/actions/youtube-channels")

          // Calculate tracks per channel
          const tracksPerChannel = Math.ceil(stream.trackLimit / stream.channels.length)

          // Track API usage
          if (typeof window !== 'undefined' && window.umami) {
            window.umami.track('youtube-api-get-channel-videos', {
              context: 'refresh-stream',
              streamId: streamId,
              channelCount: stream.channels.length
            });
          }

          // Fetch videos from all channels in parallel
          const allVideosResults = await Promise.all(
            stream.channels.map((ch) => getChannelLatestVideos(ch.id, ch.title, tracksPerChannel, ch.thumbnailUrl))
          )

          // Flatten and filter out errors
          const allVideos = allVideosResults
            .filter((result) => !result.error)
            .flatMap((result) => result.results)

          // Sort by published date (newest first) using ISO timestamps
          const sortedVideos = allVideos
            .sort((a, b) => {
              const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
              const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
              return dateB - dateA // Newer first (descending order)
            })
            .slice(0, stream.trackLimit)

          // Convert to Track format
          const convertToTrack = (video: ChannelVideoResult): Track => {
            // Helper to parse duration (e.g., "3:45" to 225 seconds)
            const parseDuration = (durationText?: string): number => {
              if (!durationText) return 0

              const parts = durationText.split(":").map((p) => parseInt(p, 10))
              if (parts.length === 2) {
                // MM:SS
                return parts[0] * 60 + parts[1]
              } else if (parts.length === 3) {
                // HH:MM:SS
                return parts[0] * 3600 + parts[1] * 60 + parts[2]
              }
              return 0
            }

            return {
              id: video.id,
              title: video.title,
              author: video.channelTitle,
              authorUrl: `https://www.youtube.com/channel/${video.channelId || ""}`,
              authorThumbnail: video.channelThumbnail,
              duration: parseDuration(video.length?.simpleText),
              thumbnailUrl: video.thumbnail?.thumbnails?.[0]?.url || `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
              addedAt: Date.now(),
              publishedAt: video.publishedAt,
              publishedTimeText: video.publishedTimeText,
            }
          }

          const newTracks = sortedVideos.map(convertToTrack)

          // Update playlist with new tracks
          const playlistStore = usePlaylistStore.getState()
          const playlist = playlistStore.playlists.find((p) => p.id === stream.playlistId)

          if (playlist) {
            // Remove all existing tracks
            playlist.tracks.forEach((track) => {
              playlistStore.removeTrackFromPlaylist(stream.playlistId, track.id)
            })

            // Add all new tracks
            newTracks.forEach((track) => {
              playlistStore.addTrackToPlaylist(stream.playlistId, track)
            })
          }

          // Update lastRefreshedAt
          get().updateLastRefreshed(streamId)
        } catch (error) {
          console.error(`Error refreshing stream ${streamId}:`, error)
          throw error
        }
      },
    }),
    {
      name: "streams-storage",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
)
