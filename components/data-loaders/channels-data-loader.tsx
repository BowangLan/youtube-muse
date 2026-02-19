import { useEffect, useMemo, useRef } from "react";
import { getChannelLatestVideoIdUnofficial } from "@/app/actions/youtube-channels-unofficial";
import { useChannelVideoPlaylistStore } from "@/lib/store/channels-video-playlist-store";
import type { Track } from "@/lib/types/playlist";
import { useChannelsStore } from "@/lib/store/channels-store";
import { CHANNEL_VIDEOS_LIMIT } from "@/lib/constants";
import type { Channel } from "@/lib/types/channel";

type StreamVideo = {
  videoId: string;
  title?: {
    runs?: Array<{ text?: string }>;
  };
  thumbnail?: {
    thumbnails?: Array<{ url?: string }>;
  };
  lengthText?: {
    simpleText?: string;
  };
  publishedTimeText?: {
    simpleText?: string;
  };
};

const parseDurationToSeconds = (lengthText: string | undefined): number => {
  if (!lengthText) return 0;
  const parts = lengthText.split(":").map(Number);
  if (parts.some(Number.isNaN)) return 0;

  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
};

const parseRelativeTimeToMs = (publishedTime: string | undefined): number | undefined => {
  if (!publishedTime) return undefined;

  const match = publishedTime.match(
    /(\d+)\s*(second|minute|hour|day|week|month|year)s?\s*ago/i
  );
  if (!match) return undefined;

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const msPerUnit: Record<string, number> = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };

  const unitMs = msPerUnit[unit];
  if (!unitMs) return undefined;

  return Date.now() - amount * unitMs;
};

const toTrack = (video: StreamVideo, channel: Channel): Track => {
  const thumbnailList = video.thumbnail?.thumbnails ?? [];
  const thumbnailUrl =
    thumbnailList[thumbnailList.length - 1]?.url ??
    thumbnailList[0]?.url ??
    `https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg`;
  const publishedTimeText = video.publishedTimeText?.simpleText;
  const publishedAtMs = parseRelativeTimeToMs(publishedTimeText);

  return {
    id: video.videoId,
    title: video.title?.runs?.[0]?.text ?? "Untitled video",
    author: channel.title || "Unknown Artist",
    authorUrl: `https://www.youtube.com/channel/${channel.id}`,
    authorThumbnail: channel.thumbnailUrl,
    duration: parseDurationToSeconds(video.lengthText?.simpleText),
    thumbnailUrl,
    addedAt: Date.now(),
    publishedAt: publishedAtMs ? new Date(publishedAtMs).toISOString() : undefined,
    publishedTimeText,
  };
};

export function ChannelsDataLoader() {
  const channels = useChannelsStore((state) => state.channels);
  const channelIds = useMemo(() => channels.map((channel) => channel.id), [channels]);
  const channelIdsKey = useMemo(() => channelIds.join(","), [channelIds]);
  const lastAppliedHashRef = useRef<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const store = useChannelVideoPlaylistStore.getState();

    if (channelIds.length === 0) {
      store.clearTracks();
      return;
    }

    const syncIntervalMs = 10 * 60 * 1000; // 10 minutes

    const sync = async () => {
      const requestId = ++requestIdRef.current;
      const perChannelTracks = await Promise.all(
        channels.map(async (channel) => {
          const result = await getChannelLatestVideoIdUnofficial(channel.id);
          if (result.error) {
            console.error(
              `[ChannelsDataLoader] Failed to fetch latest videos for ${channel.id}: ${result.error}`
            );
            return [] as Track[];
          }

          return result.videos
            .slice(0, CHANNEL_VIDEOS_LIMIT)
            .map((video) => toTrack(video as StreamVideo, channel));
        })
      );

      if (requestId !== requestIdRef.current) return;

      const mergedTracks = perChannelTracks
        .flat()
        .sort((a, b) => {
          const aMs = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const bMs = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return bMs - aMs;
        });

      const dedupedTracks = mergedTracks.filter(
        (track, index, arr) => arr.findIndex((item) => item.id === track.id) === index
      );

      const hash = JSON.stringify(
        dedupedTracks.map((track) => ({
          id: track.id,
          publishedAt: track.publishedAt,
          title: track.title,
        }))
      );

      if (lastAppliedHashRef.current === hash) return;

      useChannelVideoPlaylistStore.getState().setTracks(dedupedTracks);
      lastAppliedHashRef.current = hash;
    };

    const handleFocus = () => {
      sync().catch((error) => {
        console.error(`[ChannelsDataLoader] Error fetching channels`, error);
      });
    };

    handleFocus();

    const intervalId = window.setInterval(handleFocus, syncIntervalMs);
    window.addEventListener("focus", handleFocus);

    return () => {
      requestIdRef.current += 1;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [channelIdsKey, channelIds.length, channels]);

  return null;
}
