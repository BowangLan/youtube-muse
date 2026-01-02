"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { moveYouTubePlayerToHost } from "./youtube-player-element";

type VideoPlayerHostProps = {
  active: boolean;
  className?: string;
};

const getAudioDock = () =>
  document.getElementById("audio-dock") as HTMLDivElement | null;

const moveToAudioDock = () => {
  const audioDock = getAudioDock();
  if (!audioDock) return;
  moveYouTubePlayerToHost(audioDock, "audio");
};

export function VideoPlayerHome({ active, className }: VideoPlayerHostProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Only move the player if it exists and this host is active
    if (!active || !hostRef.current) return;

    // Check if player element exists before trying to move it
    const playerElement = document.getElementById("youtube-player");
    if (!playerElement) return;

    moveYouTubePlayerToHost(hostRef.current, "audio");
  }, [active]);

  return (
    <div
      id="audio-dock"
      ref={hostRef}
      className={cn("absolute left-[-9999px] h-px w-px", className)}
      aria-hidden="true"
    />
  );
}

export function VideoPlayerSlot({ active, className }: VideoPlayerHostProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (active && hostRef.current) {
      moveYouTubePlayerToHost(hostRef.current, "video");
    } else {
      moveToAudioDock();
    }

    return () => {
      moveToAudioDock();
    };
  }, [active]);

  return <div ref={hostRef} className={className} />;
}
