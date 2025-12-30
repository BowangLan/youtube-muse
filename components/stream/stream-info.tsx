"use client";

import * as React from "react";
import { motion } from "motion/react";
import { EASING_DURATION_CARD, EASING_EASE_OUT } from "@/lib/styles/animation";
import type { Stream } from "@/lib/types/stream";
import type { Playlist } from "@/lib/types/playlist";

interface StreamInfoProps {
  stream: Stream;
  playlist: Playlist;
}

export function StreamInfo({ stream, playlist }: StreamInfoProps) {
  const getChannelUrl = React.useCallback(
    (customUrl: string | undefined, id: string) => {
      if (customUrl) {
        if (customUrl.startsWith("http")) {
          return customUrl;
        }

        if (
          customUrl.startsWith("@") ||
          customUrl.startsWith("channel/") ||
          customUrl.startsWith("c/") ||
          customUrl.startsWith("user/")
        ) {
          return `https://www.youtube.com/${customUrl}`;
        }

        return `https://www.youtube.com/@${customUrl}`;
      }

      return `https://www.youtube.com/channel/${id}`;
    },
    []
  );

  return (
    <div className="relative z-10 mx-auto mt-10 max-w-5xl space-y-4 sm:space-y-5">
      <div className="text-[10px]/[12px] uppercase tracking-[0.32em] text-white/60 md:text-xs">
        Stream
      </div>
      <motion.h1
        className="text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl"
        layout="position"
        transition={{
          duration: EASING_DURATION_CARD,
          ease: EASING_EASE_OUT,
        }}
      >
        {stream.name}
      </motion.h1>
      {stream.description && (
        <p className="max-w-2xl text-sm text-white/70 sm:text-base">
          {stream.description}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-white/70 sm:text-sm">
        {stream.channels.map((channel) => (
          <a
            key={channel.id}
            href={getChannelUrl(channel.customUrl, channel.id)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-1 pr-3 py-1 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <img
              src={channel.thumbnailUrl}
              alt={channel.title}
              loading="lazy"
              className="h-5 w-5 rounded-full object-cover"
            />
            <span className="max-w-[140px] truncate sm:max-w-[180px]">
              {channel.title}
            </span>
          </a>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-white/70 sm:text-sm">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
          Limit {stream.trackLimit}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-white/55 sm:hidden">
        <span>Tap a track to play or pause.</span>
      </div>
    </div>
  );
}
