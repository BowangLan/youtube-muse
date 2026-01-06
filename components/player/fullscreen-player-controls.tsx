"use client";

import { usePlaylistStore } from "@/lib/store/playlist-store";
import {
  PlayPauseButton,
  ProgressBar,
  TimeDisplay,
  VolumeControl,
} from "@/components/player/player-controls";
import { formatDate } from "@/lib/utils/youtube";
import { Button } from "../ui/button";
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";
import Link from "next/link";

export function FullscreenPlayerControls() {
  const currentTrack = usePlaylistStore((state) => state.getCurrentTrack());
  const setVideoMode = useYouTubePlayerInstanceStore(
    (state) => state.setVideoMode
  );

  if (!currentTrack) {
    return (
      <div
        className="mt-4 mx-auto w-full max-w-6xl z-20 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <TimeDisplay />
        <ProgressBar className="mt-2" />
        <div className="flex mt-6 gap-2">
          <PlayPauseButton className="h-10 w-10" iconClassName="size-5" />
          <div className="flex-1"></div>
          <VolumeControl />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Track Info Section */}
      <div
        className="mt-4 mx-auto w-full max-w-6xl z-20 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href={`https://www.youtube.com/watch?v=${currentTrack.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 transition-colors hover:underline"
            >
              <h1 className="text-white text-xl font-medium leading-tight line-clamp-2 transition-colors">
                {currentTrack.title}
              </h1>
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm text-white/80">
            {currentTrack.authorThumbnail && (
              <img
                src={currentTrack.authorThumbnail}
                alt={`${currentTrack.author} avatar`}
                className="w-8 h-8 rounded-full"
              />
            )}
            <a
              href={currentTrack.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/80 hover:text-foreground transition-colors hover:underline"
            >
              {currentTrack.author}
            </a>
            {currentTrack.publishedAt && (
              <>
                <span className="text-white/60">•</span>
                <span>
                  {currentTrack.publishedTimeText ||
                    formatDate(currentTrack.addedAt)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
