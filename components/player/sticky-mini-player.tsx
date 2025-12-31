"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/lib/store/player-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useHasMounted } from "@/hooks/use-has-mounted";

export function StickyMiniPlayer() {
  const track = usePlaylistStore((state) => state.getCurrentTrack());
  const {
    dispatch,
    isLoadingNewVideo,
    apiReady,
    pendingPlayState,
    isPlaying,
  } = usePlayerStore();
  const {
    repeatMode,
    currentTrackIndex,
    playlists,
    currentPlaylistId,
  } = usePlaylistStore();
  // const hasMounted = useHasMounted();

  const [isPlayerHidden, setIsPlayerHidden] = React.useState(false);

  // Intersection Observer to detect when player is hidden
  // TODO: Refine this
  // React.useEffect(() => {
  //   if (!hasMounted) return;
  //   if (!track) {
  //     setIsPlayerHidden(false);
  //     return;
  //   }

  //   const observer = new IntersectionObserver(
  //     ([entry]) => {
  //       setIsPlayerHidden(!entry.isIntersecting);
  //     },
  //     {
  //       threshold: 0.85,
  //       rootMargin: "-0px 0px 0px 0px", // Trigger when player is 60px from top
  //     }
  //   );

  //   const currentRef = document.getElementById("player-header");
  //   if (currentRef) {
  //     observer.observe(currentRef);
  //   }

  //   return () => {
  //     if (currentRef) {
  //       observer.unobserve(currentRef);
  //     }
  //     observer.disconnect();
  //   };
  // }, [hasMounted, track?.id]); // Use track.id to detect changes

  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);
  const canPlayNext =
    !!currentPlaylist &&
    (repeatMode === "playlist"
      ? currentPlaylist.tracks.length > 0
      : currentTrackIndex < currentPlaylist.tracks.length - 1);

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-40 trans",
        isPlayerHidden
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0 pointer-events-none"
      )}
    >
      <div className="mx-auto w-full max-w-4xl px-4 py-3 sm:px-6">
        {track && (
          <div className="flex items-center gap-4 rounded-full border border-white/10 px-4 py-2 text-sm text-white backdrop-blur-xl bg-[#050505]/25">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative h-10 w-10 overflow-hidden rounded-md aspect-video flex-shrink-0">
                <Image
                  src={track.thumbnailUrl}
                  alt={track.title}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <Link
                  href={`https://www.youtube.com/watch?v=${track.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  <p className="truncate text-sm">{track.title}</p>
                </Link>
                <Link
                  href={track.authorUrl ?? ""}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  <p className="truncate text-xs uppercase text-neutral-500">
                    {track.author || "Unknown Artist"}
                  </p>
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => dispatch({ type: "UserTogglePlay" })}
                disabled={
                  isLoadingNewVideo || pendingPlayState !== null || !apiReady
                }
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white disabled:opacity-40 hover:bg-white/10 transition-colors"
              >
                {!apiReady || isLoadingNewVideo ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : isPlaying || pendingPlayState !== null ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 translate-x-[1px]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "UserNextTrack" })}
                disabled={!canPlayNext}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 text-white disabled:opacity-30 hover:bg-white/10 transition-colors"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
