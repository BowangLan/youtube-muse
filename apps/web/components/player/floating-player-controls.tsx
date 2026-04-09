"use client";

import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";
import { FullscreenIcon, XIcon } from "lucide-react";
import { PlayPauseButton } from "./player-controls";

export function FloatingPlayerControls() {
  const setVideoMode = useYouTubePlayerInstanceStore(
    (state) => state.setVideoMode
  );
  const videoMode = useYouTubePlayerInstanceStore((state) => state.videoMode);

  if (videoMode !== "floating") {
    return null;
  }

  return (
    <div className="group-hover:opacity-100 opacity-0 transition-all duration-300 ease-out absolute inset-0 rounded-lg overflow-hidden bg-black/50 flex items-center justify-center z-20">
      <div className="flex items-center justify-center gap-2">
        <div
          className="size-10 rounded-full hover:bg-white/10 hover:scale-105 trans active:scale-95 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setVideoMode("hidden");
          }}
        >
          <XIcon className="size-5 text-white" />
        </div>

        <PlayPauseButton
          className="size-10 rounded-full hover:bg-white/10 hover:scale-105 trans active:scale-95 flex items-center justify-center"
          variant="ghost"
        />

        <div
          className="size-10 rounded-full hover:bg-white/10 hover:scale-105 trans active:scale-95 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setVideoMode("fullscreen");
          }}
        >
          <FullscreenIcon className="size-5 text-white" />
        </div>
      </div>
    </div>
  )
}