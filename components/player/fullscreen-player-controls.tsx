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
import { Minimize2 } from "lucide-react";
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";

export function FullscreenPlayerControls() {
  const currentTrack = usePlaylistStore((state) => state.getCurrentTrack());
  const setVideoMode = useYouTubePlayerInstanceStore(
    (state) => state.setVideoMode
  );

  if (!currentTrack) {
    return (
      <div
        className="mt-6 mx-auto w-full max-w-4xl z-20"
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
      {/* <div
        className="mt-6 mx-auto w-full max-w-5xl z-20 hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <TimeDisplay />
        <ProgressBar className="mt-2" />
        <div className="flex mt-6 gap-2">
          <PlayPauseButton className="h-10 w-10" iconClassName="size-5" />
          <div className="flex-1"></div>
          <VolumeControl />
        </div>
      </div> */}

      {/* Track Info Section */}
      <div className="mt-6 mx-auto w-full max-w-5xl z-20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-white inline-flex flex-1 text-xl font-medium leading-tight line-clamp-2">
              {currentTrack.title}
            </h1>

            {/* TODO: Minimize button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-white/80"
              onClick={(e) => {
                e.stopPropagation();
                setVideoMode("floating");
              }}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
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
              className="hover:text-white transition-colors"
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
