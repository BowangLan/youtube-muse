import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useMemo, useRef } from "react";
import { syncChannelLatestVideo } from "@/app/actions/youtube-channels-sync";
import { useChannelVideoPlaylistStore } from "@/lib/store/channels-video-playlist-store";
import type { Track } from "@/lib/types/playlist";
import { useChannelsStore } from "@/lib/store/channels-store";

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

export function ChannelsDataLoader() {
  const channels = useChannelsStore((state) => state.channels);
  const channelIds = useMemo(() => channels.map((channel) => channel.id), [channels]);
  const channelIdsKey = useMemo(() => channelIds.join(","), [channelIds]);
  console.debug(`[ChannelsDataLoader] Channel IDs: ${channelIdsKey}`);

  const LIMIT = 15; // TODO: Move this to a config

  const videos = useQuery(
    api.channelVideos.getLatestVideosByChannelIds,
    channelIds.length > 0
      ? {
        channelIds,
        limit: LIMIT,
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

    const syncIntervalMs = 10 * 60 * 1000; // 10 minutes

    const sync = async () => {
      await Promise.all(
        channelIds.map(async (channelId) => {
          console.debug(`[ChannelsDataLoader] Syncing channel: ${channelId}`);
          const result = await syncChannelLatestVideo(
            channelId,
            LIMIT
          );
          console.debug(
            `[ChannelsDataLoader] Sync result for ${channelId}:
            ${JSON.stringify(result, null, 2)}`
          );
        })
      );
    };

    const handleFocus = () => {
      sync().catch((error) => {
        console.error(
          `[ChannelsDataLoader] Error syncing channels`,
          error
        );
      });
    };

    sync().catch((error) => {
      console.error(
        `[ChannelsDataLoader] Error syncing channels`,
        error
      );
    });

    const intervalId = window.setInterval(handleFocus, syncIntervalMs);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [channelIdsKey]);

  useEffect(() => {
    // sync convex videos to channel video playlist
    if (videos) {
      if (videosHash && lastAppliedHashRef.current === videosHash) {
        return;
      }

      try {
        // Convert videos to tracks
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
            id: video.videoId || video.id || "",
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

        useChannelVideoPlaylistStore.getState().setTracks(newTracks);
        lastAppliedHashRef.current = videosHash ?? null;

        console.debug(
          `[ChannelsDataLoader] Updated channel video playlist with ${newTracks.length} tracks`
        );
      } catch (error) {
        console.error(
          `[ChannelsDataLoader] Error updating channel video playlist:`,
          error
        );
      }
    }
  }, [videosHash]);

  console.debug(
    `[ChannelsDataLoader]
    Channels: ${channelIds.length};
    Videos: ${videos?.length ?? 0};
    State: ${videos === undefined ? "Loading" : "Done"}`
  );

  return null;
}
