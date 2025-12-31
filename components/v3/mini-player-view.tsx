"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  Variants,
  useReducedMotion,
} from "motion/react";
import { usePlayerStore } from "@/lib/store/player-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useImageColors } from "@/hooks/use-image-colors";
import { useBeatSyncStyles } from "@/hooks/use-beat-sync";
import { getThumbnailUrl } from "@/lib/utils/youtube";
import { ProgressBar, TimeDisplay } from "@/components/player/player-controls";
import { cn } from "@/lib/utils";
import { Track } from "@/lib/types/playlist";
import { EASING_EASE_OUT } from "@/lib/styles/animation";
import { Icons } from "@/components/icons";

// =============================================================================
// Constants
// =============================================================================

const EXPANDED_HEIGHT = 200;
const EXPANDED_PADDING = 20;
const COLLAPSED_HEIGHT = 66;

const EXPAND_DURATION = 0.5;
const COLLAPSE_DURATION = 0.5;

const getContainerVariants = (reduceMotion: boolean): Variants => ({
  collapsed: {
    height: COLLAPSED_HEIGHT,
    maxWidth: "53rem", // 56rem - 1.5rem (px-6) padding
    transition: {
      duration: reduceMotion ? 0 : COLLAPSE_DURATION,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  expanded: {
    height: EXPANDED_HEIGHT,
    maxWidth: "64rem",
    transition: {
      duration: reduceMotion ? 0 : EXPAND_DURATION,
      ease: [0.4, 0, 0.2, 1],
    },
  },
});

// =============================================================================
// Shared Component Props
// =============================================================================

interface GlowLayerProps {
  isPlaying: boolean;
  glowStyle: React.CSSProperties;
  variant: "collapsed" | "expanded";
}

interface TrackCoverProps {
  track: Track;
  isPlaying: boolean;
  glowStyle: React.CSSProperties;
}

interface TrackInfoProps {
  track: Track;
  variant: "collapsed" | "expanded";
}

interface PlayerControlsProps {
  isPlaying: boolean;
  isLoadingNewVideo: boolean;
  pendingPlayState: boolean | null;
  apiReady: boolean;
  canPlayNext: boolean;
  onTogglePlay: () => void;
  onSkipBackward: () => void;
  onPlayNext: () => void;
}

// =============================================================================
// Subcomponents
// =============================================================================

const GlowLayer = ({ isPlaying, glowStyle, variant }: GlowLayerProps) => {
  const reduceMotion = useReducedMotion();
  const borderRadius = variant === "collapsed" ? "rounded-md" : "rounded-lg";

  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeInOut" }}
          className={cn(
            "absolute inset-0 pointer-events-none animate-glow-pulse motion-reduce:animate-none",
            borderRadius
          )}
          style={{
            zIndex: -1,
            ...glowStyle,
          }}
        />
      )}
    </AnimatePresence>
  );
};

const TrackCoverCollapsed = ({
  track,
  isPlaying,
  glowStyle,
}: TrackCoverProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layoutId="track-cover"
      className="relative h-10 w-10 shrink-0 overflow-visible rounded-md"
      transition={{
        duration: reduceMotion ? 0 : COLLAPSE_DURATION,
        ease: [0.4, 0, 0.2, 1],
      }}
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
      <GlowLayer
        isPlaying={isPlaying}
        glowStyle={glowStyle}
        variant="collapsed"
      />
    </motion.div>
  );
};

const TrackCoverExpanded = ({
  track,
  isPlaying,
  glowStyle,
}: TrackCoverProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      layoutId="track-cover"
      className="relative shrink-0 overflow-visible rounded-lg flex-none"
      style={{
        width: EXPANDED_HEIGHT - EXPANDED_PADDING * 2,
        height: EXPANDED_HEIGHT - EXPANDED_PADDING * 2,
      }}
      transition={{
        duration: reduceMotion ? 0 : EXPAND_DURATION,
        ease: [0.4, 0, 0.2, 1],
      }}
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
      <GlowLayer
        isPlaying={isPlaying}
        glowStyle={glowStyle}
        variant="expanded"
      />
    </motion.div>
  );
};

export const TrackAuthorCollapsed = ({ track }: { track: Track }) => {
  return (
    <motion.div layoutId="track-author">
      <Link
        href={track.authorUrl ?? ""}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        <p className="truncate text-xs/tight text-neutral-400">
          {track.author || "Unknown Artist"}
        </p>
      </Link>
    </motion.div>
  );
};

export const TrackAuthorExpanded = ({ track }: { track: Track }) => {
  return (
    <motion.div layoutId="track-author">
      <Link
        href={track.authorUrl ?? ""}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline"
      >
        <p className="truncate text-sm/tight text-neutral-400">
          {track.author || "Unknown Artist"}
        </p>
      </Link>
    </motion.div>
  );
};

const TrackInfo = ({ track, variant }: TrackInfoProps) => {
  const isCollapsed = variant === "collapsed";

  return (
    <div className={cn("min-w-0", !isCollapsed && "flex flex-col gap-3")}>
      <motion.div layoutId="track-title">
        <Link
          href={`https://www.youtube.com/watch?v=${track.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline w-fit max-w-[50vw] flex"
        >
          {isCollapsed ? (
            <p className="truncate text-sm">{track.title || "Loading..."}</p>
          ) : (
            <h3 className="font-medium/tight text-base text-neutral-200 leading-snug line-clamp-2">
              {track.title || "Loading..."}
            </h3>
          )}
        </Link>
      </motion.div>
      <motion.div layoutId="track-author">
        <Link
          href={track.authorUrl ?? ""}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline w-fit max-w-[50vw] flex"
        >
          <p
            className={cn(
              "truncate text-neutral-400",
              isCollapsed ? "text-xs" : "text-sm/tight"
            )}
          >
            {track.author || "Unknown Artist"}
          </p>
        </Link>
      </motion.div>
    </div>
  );
};

const ProgressSection = ({ isExpanded }: { isExpanded: boolean }) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col gap-4 mt-7"
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isExpanded ? 1 : 0,
        y: isExpanded ? 0 : 10,
      }}
      transition={{
        duration: reduceMotion ? 0 : 0.3,
        ease: [0.4, 0, 0.2, 1],
        delay: isExpanded && !reduceMotion ? 0.15 : 0,
      }}
    >
      <ProgressBar />
      <TimeDisplay />
    </motion.div>
  );
};

const PlayerControls = ({
  isPlaying,
  isLoadingNewVideo,
  pendingPlayState,
  apiReady,
  canPlayNext,
  onTogglePlay,
  onSkipBackward,
  onPlayNext,
}: PlayerControlsProps) => {
  const controlButtonClass =
    "flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 active:bg-white/20 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80";

  const playButtonClass =
    "flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 active:scale-95 active:bg-white/30 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-white/10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80";

  return (
    <div className="flex items-center text-foreground justify-center gap-4 mt-2">
      <button
        type="button"
        aria-label="Skip back"
        onClick={onSkipBackward}
        disabled={!apiReady}
        className={controlButtonClass}
      >
        <Icons.SkipBack className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label={isPlaying || pendingPlayState !== null ? "Pause" : "Play"}
        aria-pressed={isPlaying || pendingPlayState !== null}
        onClick={onTogglePlay}
        disabled={isLoadingNewVideo || pendingPlayState !== null || !apiReady}
        className={playButtonClass}
      >
        {!apiReady || isLoadingNewVideo ? (
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : isPlaying || pendingPlayState !== null ? (
          <Icons.Pause className="h-6 w-6" />
        ) : (
          <Icons.Play className="h-6 w-6" />
        )}
      </button>
      <button
        type="button"
        aria-label="Skip forward"
        onClick={onPlayNext}
        disabled={!canPlayNext}
        className={controlButtonClass}
      >
        <Icons.SkipForward className="h-5 w-5" />
      </button>
    </div>
  );
};

const ExpandToggleButton = ({
  isExpanded,
  onToggle,
}: {
  isExpanded: boolean;
  onToggle: () => void;
}) => (
  <button
    type="button"
    aria-label={isExpanded ? "Collapse player" : "Expand player"}
    aria-expanded={isExpanded}
    onClick={onToggle}
    className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 active:bg-white/20 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80"
  >
    <Icons.ChevronUp
      className={cn(
        "h-5 w-5 transition-transform duration-200",
        isExpanded ? "rotate-180" : "rotate-0"
      )}
    />
  </button>
);

const AnimatedControlsWrapper = ({
  isExpanded,
  children,
}: {
  isExpanded: boolean;
  children: React.ReactNode;
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isExpanded ? 1 : 0,
        y: isExpanded ? 0 : 10,
      }}
      transition={{
        duration: reduceMotion ? 0 : 0.3,
        ease: [0.4, 0, 0.2, 1],
        delay: isExpanded && !reduceMotion ? 0.2 : 0,
      }}
    >
      {children}
    </motion.div>
  );
};

// =============================================================================
// Hooks
// =============================================================================

function useGlowStyle(colors: ReturnType<typeof useImageColors>) {
  return React.useMemo(() => {
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
}

// =============================================================================
// Collapsed State View
// =============================================================================

const CollapsedStateView = ({
  track,
  isPlaying,
  glowStyle,
  isExpanded,
}: {
  track: Track;
  isPlaying: boolean;
  glowStyle: React.CSSProperties;
  isExpanded: boolean;
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center gap-4 p-3"
      initial={false}
      animate={{
        opacity: isExpanded ? 0 : 1,
        pointerEvents: isExpanded ? "none" : "auto",
      }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <TrackCoverCollapsed
          track={track}
          isPlaying={isPlaying}
          glowStyle={glowStyle}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <TrackInfo track={track} variant="collapsed" />
          <ProgressBar className="h-1" />
        </div>
      </div>
    </motion.div>
  );
};

// =============================================================================
// Expanded State View
// =============================================================================

const ExpandedStateView = ({
  track,
  isPlaying,
  glowStyle,
  isExpanded,
  isLoadingNewVideo,
  pendingPlayState,
  apiReady,
  canPlayNext,
  onTogglePlay,
  onSkipBackward,
  onPlayNext,
  onToggleExpanded,
}: {
  track: Track;
  isPlaying: boolean;
  glowStyle: React.CSSProperties;
  isExpanded: boolean;
  isLoadingNewVideo: boolean;
  pendingPlayState: boolean | null;
  apiReady: boolean;
  canPlayNext: boolean;
  onTogglePlay: () => void;
  onSkipBackward: () => void;
  onPlayNext: () => void;
  onToggleExpanded: () => void;
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-row"
      initial={false}
      animate={{
        opacity: isExpanded ? 1 : 0,
        pointerEvents: isExpanded ? "auto" : "none",
      }}
      transition={{
        duration: reduceMotion ? 0 : 0.2,
        ease: [0.4, 0, 0.2, 1],
        delay: isExpanded && !reduceMotion ? 0.1 : 0,
      }}
      style={{
        padding: EXPANDED_PADDING,
        gap: EXPANDED_PADDING,
      }}
    >
      <TrackCoverExpanded
        track={track}
        isPlaying={isPlaying}
        glowStyle={glowStyle}
      />

      <div className="flex flex-col flex-1">
        <div className="flex items-start justify-between gap-4">
          <TrackInfo track={track} variant="expanded" />
          <ExpandToggleButton
            isExpanded={isExpanded}
            onToggle={onToggleExpanded}
          />
        </div>
        <ProgressSection isExpanded={isExpanded} />
        <AnimatedControlsWrapper isExpanded={isExpanded}>
          <PlayerControls
            isPlaying={isPlaying}
            isLoadingNewVideo={isLoadingNewVideo}
            pendingPlayState={pendingPlayState}
            apiReady={apiReady}
            canPlayNext={canPlayNext}
            onTogglePlay={onTogglePlay}
            onSkipBackward={onSkipBackward}
            onPlayNext={onPlayNext}
          />
        </AnimatedControlsWrapper>
      </div>
    </motion.div>
  );
};

// =============================================================================
// Background Overlay
// =============================================================================

export const BackgroundOverlay = () => (
  <motion.div
    aria-hidden="true"
    className="absolute inset-0 z-0 pointer-events-none bg-black/95"
    initial={false}
    transition={{ duration: 0.3, ease: EASING_EASE_OUT }}
  />
);

// =============================================================================
// Main Component
// =============================================================================

export function MiniPlayerViewDesktop() {
  const reduceMotion = useReducedMotion();
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

  const [isHovered, setIsHovered] = React.useState(false);
  const [isPinned, setIsPinned] = React.useState(false);
  const isExpanded = isHovered || isPinned;

  // Extract colors from thumbnail for glow effect
  const thumbnailUrl = track
    ? getThumbnailUrl(track.id, "mqdefault")
    : undefined;
  const colors = useImageColors(thumbnailUrl);
  const glowStyle = useGlowStyle(colors);

  // Get beat-synced animation timing
  const { style: beatStyle } = useBeatSyncStyles();
  const containerVariants = React.useMemo(
    () => getContainerVariants(reduceMotion ?? false),
    [reduceMotion]
  );

  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);
  const canPlayNext =
    !!currentPlaylist &&
    (repeatMode === "playlist"
      ? currentPlaylist.tracks.length > 0
      : currentTrackIndex < currentPlaylist.tracks.length - 1);

  if (!track) {
    return (
      <div
        className="w-full px-4 sm:px-6 fixed bottom-8 left-0 right-0 z-40"
        style={{
          bottom: `-${COLLAPSED_HEIGHT}px`,
          minHeight: COLLAPSED_HEIGHT,
        }}
      />
    );
  }

  const _isPlaying = isPlaying || pendingPlayState !== null;

  return (
    <div
      className="w-full px-4 sm:px-6 fixed bottom-8 left-0 right-0 z-40"
      style={{ minHeight: COLLAPSED_HEIGHT }}
    >
      <motion.div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        layout
        className={cn(
          "relative rounded-xl mx-auto w-full max-w-4xl overflow-hidden border bg-zinc-500/10 text-white backdrop-blur-xl",
          isExpanded ? "border-zinc-500/20" : "border-zinc-500/20",
          _isPlaying && "animate-container-glow"
        )}
        style={{ ...glowStyle, ...(reduceMotion ? {} : beatStyle) }}
        variants={containerVariants}
        initial="collapsed"
        animate={isExpanded ? "expanded" : "collapsed"}
      >
        <BackgroundOverlay />

        <CollapsedStateView
          track={track}
          isPlaying={_isPlaying}
          glowStyle={glowStyle}
          isExpanded={isExpanded}
        />

        <ExpandedStateView
          track={track}
          isPlaying={_isPlaying}
          glowStyle={glowStyle}
          isExpanded={isExpanded}
          isLoadingNewVideo={isLoadingNewVideo}
          pendingPlayState={pendingPlayState}
          apiReady={apiReady}
          canPlayNext={canPlayNext}
          onTogglePlay={() => dispatch({ type: "UserTogglePlay" })}
          onSkipBackward={() => dispatch({ type: "UserSkipBackward" })}
          onPlayNext={() => dispatch({ type: "UserNextTrack" })}
          onToggleExpanded={() => setIsPinned((prev) => !prev)}
        />
      </motion.div>
    </div>
  );
}
