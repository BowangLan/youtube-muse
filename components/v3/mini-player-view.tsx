"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { AnimatePresence, motion, Variants } from "motion/react";
import { usePlayerStore } from "@/lib/store/player-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useImageColors } from "@/hooks/use-image-colors";
import { getThumbnailUrl } from "@/lib/utils/youtube";
import { ProgressBar, TimeDisplay } from "@/components/player/player-controls";

const EXPANDED_HEIGHT = 160;
const EXPANDED_PADDING = 20;
const COLLAPSED_HEIGHT = 66;

// Animation variants
const containerVariants: Variants = {
  collapsed: {
    height: COLLAPSED_HEIGHT,
    backgroundColor: "rgba(63, 63, 70, 0.1)",
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  expanded: {
    height: EXPANDED_HEIGHT,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export function MiniPlayerView() {
  const track = usePlaylistStore((state) => state.getCurrentTrack());
  const {
    togglePlay,
    isLoadingNewVideo,
    apiReady,
    pendingPlayState,
    isPlaying,
    skipForward,
    skipBackward,
  } = usePlayerStore();
  const {
    playNext,
    repeatMode,
    currentTrackIndex,
    playlists,
    currentPlaylistId,
  } = usePlaylistStore();

  const [isHovered, setIsHovered] = React.useState(false);

  // Extract colors from thumbnail for glow effect
  const thumbnailUrl = track
    ? getThumbnailUrl(track.id, "mqdefault")
    : undefined;
  const colors = useImageColors(thumbnailUrl);

  // Create CSS variables for glow colors based on extracted colors
  const glowStyle = React.useMemo(() => {
    if (!colors) {
      return {};
    }

    const parseRgb = (rgbString: string) => {
      const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!match) return { r: 255, g: 255, b: 255 };
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
      };
    };

    const vibrant = parseRgb(colors.vibrant);
    const dominant = parseRgb(colors.dominant);

    return {
      "--glow-color-1": `rgba(${vibrant.r}, ${vibrant.g}, ${vibrant.b}, 0.4)`,
      "--glow-color-2": `rgba(${dominant.r}, ${dominant.g}, ${dominant.b}, 0.25)`,
      "--glow-color-3": `rgba(${vibrant.r}, ${vibrant.g}, ${vibrant.b}, 0.12)`,
    } as React.CSSProperties;
  }, [colors]);

  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);
  const canPlayNext =
    !!currentPlaylist &&
    (repeatMode === "playlist"
      ? currentPlaylist.tracks.length > 0
      : currentTrackIndex < currentPlaylist.tracks.length - 1);

  return (
    <div
      className="mx-auto w-full max-w-4xl px-4 sm:px-6"
      style={{
        bottom: !track ? "-60px" : undefined,
        minHeight: COLLAPSED_HEIGHT,
      }}
    >
      <div>
        {track && (
          <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative rounded-xl overflow-hidden border border-white/10 text-white backdrop-blur-xl"
            variants={containerVariants}
            initial="collapsed"
            animate={isHovered ? "expanded" : "collapsed"}
          >
            {/* Collapsed state */}
            <motion.div
              className="absolute inset-0 flex items-center gap-4 p-3"
              initial={false}
              animate={{
                opacity: isHovered ? 0 : 1,
                pointerEvents: isHovered ? "none" : "auto",
              }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <motion.div
                  layoutId="track-cover"
                  className="relative h-10 w-10 shrink-0 overflow-visible rounded-md"
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <div className="relative w-full h-full overflow-hidden rounded-md">
                    <Image
                      src={track.thumbnailUrl}
                      alt={track.title}
                      fill
                      sizes="40px"
                      className="object-cover"
                    />
                  </div>
                  {/* Animated Glow Layer - Collapsed */}
                  <AnimatePresence>
                    {isPlaying && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-md pointer-events-none animate-glow-pulse"
                        style={{
                          zIndex: -1,
                          ...glowStyle,
                        }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
                <div className="min-w-0">
                  <motion.div layoutId="track-title">
                    <Link
                      href={`https://www.youtube.com/watch?v=${track.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      <p className="truncate text-sm">{track.title}</p>
                    </Link>
                  </motion.div>
                  <motion.div layoutId="track-author">
                    <Link
                      href={track.authorUrl ?? ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      <p className="truncate text-xs text-neutral-400">
                        {track.author || "Unknown Artist"}
                      </p>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Expanded state */}
            <motion.div
              className="absolute inset-0 flex flex-row"
              initial={false}
              animate={{
                opacity: isHovered ? 1 : 0,
                pointerEvents: isHovered ? "auto" : "none",
              }}
              transition={{
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1],
                delay: isHovered ? 0.1 : 0,
              }}
              style={{
                padding: EXPANDED_PADDING,
                gap: EXPANDED_PADDING,
              }}
            >
              {/* Left - Album art */}
              <motion.div
                layoutId="track-cover"
                className="relative shrink-0 overflow-visible rounded-lg flex-none"
                style={{
                  width: EXPANDED_HEIGHT - EXPANDED_PADDING * 2,
                  height: EXPANDED_HEIGHT - EXPANDED_PADDING * 2,
                }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="relative w-full h-full overflow-hidden rounded-lg shadow-2xl">
                  <Image
                    src={track.thumbnailUrl}
                    alt={track.title}
                    fill
                    sizes={`${EXPANDED_HEIGHT - EXPANDED_PADDING * 2}px`}
                    className="object-cover"
                  />
                </div>
                {/* Animated Glow Layer - Expanded */}
                <AnimatePresence>
                  {isPlaying && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-lg pointer-events-none animate-glow-pulse"
                      style={{
                        zIndex: -1,
                        ...glowStyle,
                      }}
                    />
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Center + Right - Track info */}
              <div className="flex flex-col flex-1">
                <div className="flex flex-col gap-3">
                  <motion.div layoutId="track-title">
                    <Link
                      href={`https://www.youtube.com/watch?v=${track.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      <h3 className="font-medium/tight text-base text-neutral-200 leading-snug line-clamp-2">
                        {track.title}
                      </h3>
                    </Link>
                  </motion.div>
                  <motion.div layoutId="track-author">
                    <Link
                      href={track.authorUrl ?? ""}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      <p className="text-sm/tight text-neutral-400">
                        {track.author || "Unknown Artist"}
                      </p>
                    </Link>
                  </motion.div>
                </div>

                {/* Progress bar section */}
                <motion.div
                  className="flex flex-col gap-4 mt-7"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    y: isHovered ? 0 : 10,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1],
                    delay: isHovered ? 0.15 : 0,
                  }}
                >
                  <ProgressBar />
                  <TimeDisplay />
                </motion.div>

                {/* Controls section */}
                <motion.div
                  className="flex items-center text-foreground justify-center gap-4 mt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: isHovered ? 1 : 0,
                    y: isHovered ? 0 : 10,
                  }}
                  transition={{
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1],
                    delay: isHovered ? 0.2 : 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={skipBackward}
                    disabled={!apiReady}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 active:bg-white/20 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent transition-all duration-150"
                  >
                    <SkipBack className="h-5 w-5" fill="currentColor" />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    disabled={
                      isLoadingNewVideo ||
                      pendingPlayState !== null ||
                      !apiReady
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 active:scale-95 active:bg-white/30 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-white/10 transition-all duration-150"
                  >
                    {!apiReady || isLoadingNewVideo ? (
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    ) : isPlaying || pendingPlayState !== null ? (
                      <Pause className="h-6 w-6" fill="currentColor" />
                    ) : (
                      <Play className="h-6 w-6" fill="currentColor" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={playNext}
                    disabled={!canPlayNext}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 active:bg-white/20 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent transition-all duration-150"
                  >
                    <SkipForward className="h-5 w-5" fill="currentColor" />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
