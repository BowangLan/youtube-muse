"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";

type VideoPlayerHostProps = {
  active: boolean;
  className?: string;
};

export function VideoPlayerHome({ active, className }: VideoPlayerHostProps) {
  const hostRef = React.useRef<HTMLDivElement>(null);
  const setHostElement = useYouTubePlayerInstanceStore(
    (state) => state.setHostElement
  );

  React.useEffect(() => {
    if (!active || !hostRef.current) return;
    setHostElement(hostRef.current);
    return () => setHostElement(null);
  }, [active, setHostElement]);

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
  const setHostElement = useYouTubePlayerInstanceStore(
    (state) => state.setHostElement
  );

  React.useEffect(() => {
    if (!hostRef.current) return;
    if (active) {
      setHostElement(hostRef.current);
    } else {
      setHostElement(null);
    }

    return () => setHostElement(null);
  }, [active, setHostElement]);

  return <div ref={hostRef} className={className} />;
}
