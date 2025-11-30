"use client";

import * as React from "react";
import Image from "next/image";
import { getThumbnailUrl } from "@/lib/utils/youtube";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { AppHeader } from "../layout/app-header";
import { Track } from "@/lib/types/playlist";
import { PlayerControls } from "./player-controls";
import { StickyMiniPlayer } from "./sticky-mini-player";
import { cn } from "@/lib/utils";

const LOADING_PHRASE_LIST = [
  "Let's grind",
  "Let's lock in",
  "Time to lock in",
  "Time to crush it, you got this",
  "Get comfortable, let's focus",
];

const InitialLoadingUI = () => {
  const isMounted = useHasMounted();
  const [loadingPhrase, setLoadingPhrase] = React.useState("");
  const [showMotion, setShowMotion] = React.useState(false);

  React.useEffect(() => {
    if (!isMounted) return;
    setLoadingPhrase(
      LOADING_PHRASE_LIST[
        Math.floor(Math.random() * LOADING_PHRASE_LIST.length)
      ]
    );
    const timer = setTimeout(() => setShowMotion(true), 1100);
    return () => clearTimeout(timer);
  }, [isMounted]);

  return (
    <div
      className={cn(
        "flex flex-col gap-8 items-center pt-[30vh] motion-opacity-in-0 motion-blur-in-lg",
        showMotion && "motion-opacity-out-0 motion-blur-out-md"
      )}
    >
      <p className="text-xl sm:text-3xl md:text-5xl font-light lowercase tracking-wider">
        {loadingPhrase}
      </p>
    </div>
  );
};

export function AnimatedPlayerHeader() {
  const hasMounted = useHasMounted();
  const playerRef = React.useRef<HTMLDivElement>(null);
  const [isPlayerHidden, setIsPlayerHidden] = React.useState(false);

  const { getCurrentTrack } = usePlaylistStore();
  const { apiReady } = usePlayerStore();

  const track = hasMounted ? getCurrentTrack() : null;

  // Intersection Observer to detect when player is hidden
  React.useEffect(() => {
    if (!hasMounted) return;
    if (!track) {
      setIsPlayerHidden(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPlayerHidden(!entry.isIntersecting);
      },
      {
        threshold: 0.85,
        rootMargin: "-0px 0px 0px 0px", // Trigger when player is 60px from top
      }
    );

    const currentRef = playerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [hasMounted, track?.id]); // Use track.id to detect changes

  if (!apiReady) {
    return <InitialLoadingUI />;
  }

  return (
    <>
      <StickyMiniPlayer isPlayerHidden={isPlayerHidden} track={track} />

      {/* App header and main player section */}
      <header className="space-y-8">
        {/* App branding */}
        <AppHeader />

        {!track ? (
          <div className="flex flex-col gap-4 text-left text-neutral-500">
            <span className="text-xs uppercase tracking-[0.4em]">
              queue empty
            </span>
            <p className="text-2xl text-white">Drop a link to begin.</p>
          </div>
        ) : (
          <div ref={playerRef} className="space-y-6">
            {/* Album art & track info */}
            <CurrentTrackHeader track={track} />

            {/* Player controls */}
            <PlayerControls />
          </div>
        )}
      </header>
    </>
  );
}

function CurrentTrackHeader({ track }: { track: Track }) {
  return (
    <div className="flex flex-col gap-6 items-center sm:items-start sm:flex-row motion-blur-in-lg motion-opacity-in-0 motion-delay-700">
      <div className="relative aspect-video w-full max-w-[24rem] sm:max-w-[16rem] md:max-w-[22rem] overflow-hidden rounded-xl">
        <Image
          src={getThumbnailUrl(track.id, "maxresdefault")}
          alt={track.title}
          fill
          sizes="220px"
          className="object-cover"
          priority
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 md:gap-3 text-neutral-300">
        <span className="text-xs uppercase tracking-[0.4em] text-neutral-500">
          playing now
        </span>
        <h2 className="md:text-3xl text-xl font-light leading-tight text-white">
          <a
            href={`https://www.youtube.com/watch?v=${track.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {track.title}
          </a>
        </h2>
        <p className="md:text-sm text-xs">
          <a
            href={track.authorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-white"
          >
            {track.author || "Unknown Artist"}
          </a>
        </p>
      </div>
    </div>
  );
}
