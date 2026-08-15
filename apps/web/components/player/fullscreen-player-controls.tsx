"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { formatDate } from "@/lib/utils/youtube";
import { SliceRepeatControls } from "./slice-repeat-controls";

export function FullscreenPlayerControls() {
  const currentTrack = usePlaylistStore((state) => state.getCurrentTrack());
  const sliceRepeatActive = usePlayerStore((state) => state.sliceRepeat.isActive);

  if (!currentTrack && !sliceRepeatActive) return null;

  return (
    <div
      className="z-20 mx-auto mt-4 w-full max-w-6xl px-1 sm:px-0"
      onClickCapture={(event) => event.stopPropagation()}
    >
      {currentTrack && (
        <div className="flex min-w-0 items-center gap-3">
          {currentTrack.authorThumbnail && (
            <img
              src={currentTrack.authorThumbnail}
              alt=""
              className="size-10 shrink-0 rounded-full border border-white/10 object-cover shadow-lg"
            />
          )}

          <div className="min-w-0 flex-1">
            <Link
              href={`https://www.youtube.com/watch?v=${currentTrack.id}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open video on YouTube"
              className="group/title flex w-fit max-w-full items-center gap-2 rounded-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <h1 className="truncate text-sm font-medium tracking-[-0.01em] sm:text-base">
                {currentTrack.title}
              </h1>
              <ExternalLink
                className="size-3.5 shrink-0 text-white/35 transition-colors group-hover/title:text-white/70"
                aria-hidden="true"
              />
            </Link>

            <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
              <a
                href={currentTrack.authorUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate rounded-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                {currentTrack.author}
              </a>
              {currentTrack.publishedAt && (
                <>
                  <span aria-hidden="true" className="text-white/25">
                    •
                  </span>
                  <span className="shrink-0">
                    {currentTrack.publishedTimeText || formatDate(currentTrack.addedAt)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {sliceRepeatActive && (
        <SliceRepeatControls className="mt-4 border-white/10 bg-white/[0.045] shadow-[0_16px_48px_rgba(0,0,0,0.25)] backdrop-blur-xl" />
      )}
    </div>
  );
}
