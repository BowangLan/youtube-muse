import { Stream } from "@/lib/types/stream";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useMemo, useRef } from "react";
import { syncChannelLatestVideo } from "@/app/actions/youtube-channels-sync";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import type { Track } from "@/lib/types/playlist";

type StreamVideo = {
  id?: string;
  videoId: string;
  title: string;
  channelId: string;
  channelTitle?: string;
  channelThumbnailUrl?: string;
  duration?: number;
  thumbnailUrl?: string;
  publishedAt?: string;
  publishedAtMs?: number;
  publishedTimeText?: string;
};

export function StreamDataLoader({ stream }: { stream: Stream }) {
  // console.log(
  //   `[StreamDataLoader] Stream info: ${JSON.stringify(stream, null, 2)}`
  // );
  const channelIds = useMemo(
    () => stream.channels.map((channel) => channel.customUrl ?? channel.id),
    [stream.channels]
  );
  console.debug(`[StreamDataLoader] Channel IDs: ${channelIds.join(", ")}`);

  const videos = useQuery(
    api.channelVideos.getLatestVideosByChannelIds,
    channelIds.length > 0
      ? {
          channelIds,
          limit: stream.trackLimit,
        }
      : "skip"
  );

  // Create a stable dependency for the videos array to avoid useEffect dependency array issues
  const videosHash = useMemo(
    () =>
      videos
        ? JSON.stringify(
            videos.map((v) => ({
              videoId: v.videoId,
              title: v.title,
              publishedAt: v.publishedAt,
            }))
          )
        : null,
    [videos]
  );
  const lastAppliedHashRef = useRef<string | null>(null);

  useEffect(() => {
    if (channelIds.length === 0) return;

    const syncIntervalMs = 10 * 60 * 1000;

    const sync = async () => {
      await Promise.all(
        channelIds.map(async (channelId) => {
          console.debug(`[StreamDataLoader] Syncing channel: ${channelId}`);
          const result = await syncChannelLatestVideo(
            channelId,
            stream.trackLimit
          );
          console.debug(
            `[StreamDataLoader] Sync result for ${channelId}:
            ${JSON.stringify(result, null, 2)}`
          );
        })
      );
    };

    const handleFocus = () => {
      sync().catch((error) => {
        console.error(
          `[StreamDataLoader] Error syncing channels for stream ${stream.id}:`,
          error
        );
      });
    };

    sync().catch((error) => {
      console.error(
        `[StreamDataLoader] Error syncing channels for stream ${stream.id}:`,
        error
      );
    });

    const intervalId = window.setInterval(handleFocus, syncIntervalMs);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [channelIds, stream.id, stream.trackLimit]);

  useEffect(() => {
    // sync convex videos to playlist tracks
    if (videos) {
      if (videosHash && lastAppliedHashRef.current === videosHash) {
        return;
      }

      const playlistStore = usePlaylistStore.getState();
      const playlist = playlistStore.playlists.find(
        (p) => p.id === stream.playlistId
      );

      if (playlist) {
        try {
          // Convert videos to tracks (similar to refreshStream logic)
          const convertToTrack = (video: StreamVideo): Track => {
            // Convert publishedAt to a valid date string
            let publishedAt: string | undefined;
            if (video.publishedAtMs) {
              // Use the parsed timestamp if available
              publishedAt = new Date(video.publishedAtMs).toISOString();
            } else if (video.publishedAt) {
              // Validate the publishedAt string
              const date = new Date(video.publishedAt);
              if (!isNaN(date.getTime())) {
                publishedAt = date.toISOString();
              }
            }

            return {
              id: video.videoId || video.id,
              title: video.title,
              author: video.channelTitle || "Unknown Artist",
              authorUrl: `https://www.youtube.com/channel/${video.channelId || ""}`,
              authorThumbnail: video.channelThumbnailUrl,
              duration: video.duration || 0,
              thumbnailUrl:
                video.thumbnailUrl ||
                `https://img.youtube.com/vi/${video.videoId || video.id}/maxresdefault.jpg`,
              addedAt: Date.now(),
              publishedAt,
              publishedTimeText: video.publishedTimeText,
            };
          };

          const newTracks = videos.map(convertToTrack);

          playlistStore.setPlaylistTracks(stream.playlistId, newTracks);
          lastAppliedHashRef.current = videosHash ?? null;

          console.debug(
            `[StreamDataLoader] Updated playlist ${stream.playlistId} with ${newTracks.length} tracks`
          );
        } catch (error) {
          console.error(
            `[StreamDataLoader] Error updating playlist for stream ${stream.id}:`,
            error
          );
        }
      } else {
        console.warn(
          `[StreamDataLoader] Playlist ${stream.playlistId} not found for stream ${stream.id}`
        );
      }
    }
  }, [videosHash, stream.id, stream.playlistId]);

  console.debug(
    `[StreamDataLoader]
    Channel: ${stream.name};
    Videos: ${videos?.length};
    State: ${videos === undefined ? "Loading" : "Done"}`
  );

  return null;
}
