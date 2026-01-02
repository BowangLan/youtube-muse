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
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useImageColors } from "@/hooks/use-image-colors";
import { useBeatSyncStyles } from "@/hooks/use-beat-sync";
import { getThumbnailUrl } from "@/lib/utils/youtube";
import { ProgressBar, TimeDisplay } from "@/components/player/player-controls";
import { cn } from "@/lib/utils";
import { Track } from "@/lib/types/playlist";
import { EASING_EASE_OUT } from "@/lib/styles/animation";
import { Icons } from "@/components/icons";
import { MonitorPlay } from "lucide-react";
import {
  MiniPlayerProvider,
  useMiniPlayerContext,
} from "./mini-player-context";
import { FEATURE_FLAGS } from "@/lib/constants";

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
  glowStyle: React.CSSProperties;
  variant: "collapsed" | "expanded";
}

interface TrackCoverProps {
  glowStyle: React.CSSProperties;
}

interface TrackInfoProps {
  variant: "collapsed" | "expanded";
}

// =============================================================================
// Subcomponents
// =============================================================================

const GlowLayer = ({ glowStyle, variant }: GlowLayerProps) => {
  const reduceMotion = useReducedMotion();
  const { isPlaying } = useMiniPlayerContext();

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
            variant === "collapsed" ? "rounded-md" : "rounded-lg"
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

const TrackCoverCollapsed = ({ glowStyle }: TrackCoverProps) => {
  const reduceMotion = useReducedMotion();
  const { track } = useMiniPlayerContext();

  if (!track) return null;

  return (
    <motion.div
      layoutId="track-cover"
      className="relative aspect-video h-10 shrink-0 overflow-visible rounded-md"
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
      <GlowLayer glowStyle={glowStyle} variant="collapsed" />
    </motion.div>
  );
};

const TrackCoverExpanded = ({ glowStyle }: TrackCoverProps) => {
  const reduceMotion = useReducedMotion();
  const { track } = useMiniPlayerContext();

  if (!track) return null;

  return (
    <motion.div
      layoutId="track-cover"
      className="relative shrink-0 overflow-visible rounded-lg flex-none h-32 w-56 self-center"
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
      <GlowLayer glowStyle={glowStyle} variant="expanded" />
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

const TrackInfo = ({ variant }: TrackInfoProps) => {
  const { track } = useMiniPlayerContext();
  const isCollapsed = variant === "collapsed";

  if (!track) return null;

  return (
    <div className={cn("min-w-0", !isCollapsed && "flex flex-col gap-3")}>
      <div key={`title-${track.id}`}>
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
      </div>
      <div key={`author-${track.id}`}>
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
      </div>
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

const PlayerControls = () => {
  const {
    isPlaying,
    isLoadingNewVideo,
    pendingPlayState,
    apiReady,
    canPlayNext,
    isVideoEnabled,
    onTogglePlay,
    onSkipBackward,
    onPlayNext,
    onToggleVideo,
  } = useMiniPlayerContext();

  const controlButtonClass =
    "flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 active:bg-white/20 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80";

  const playButtonClass =
    "flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 active:scale-95 active:bg-white/30 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-white/10 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80";

  return (
    <div className="flex items-center justify-center gap-4 mt-2 text-foreground">
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
      {FEATURE_FLAGS.ENABLE_VIDEO_PLAYBACK && (
        <button
          type="button"
          aria-label={isVideoEnabled ? "Disable video" : "Enable video"}
          aria-pressed={isVideoEnabled}
          onClick={onToggleVideo}
          className={cn(
            controlButtonClass,
            isVideoEnabled && "bg-white/15 text-white"
          )}
        >
          <MonitorPlay className="h-5 w-5" />
        </button>
      )}
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
  glowStyle,
}: {
  glowStyle: React.CSSProperties;
}) => {
  const reduceMotion = useReducedMotion();
  const { track, isExpanded } = useMiniPlayerContext();

  if (!track) return null;

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
        <TrackCoverCollapsed glowStyle={glowStyle} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <TrackInfo variant="collapsed" />
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
  glowStyle,
}: {
  glowStyle: React.CSSProperties;
}) => {
  const reduceMotion = useReducedMotion();
  const { track, isExpanded, onToggleExpanded } = useMiniPlayerContext();

  if (!track) return null;

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
      <TrackCoverExpanded glowStyle={glowStyle} />

      <div className="flex flex-col flex-1">
        <div className="flex items-start justify-between gap-4">
          <TrackInfo variant="expanded" />
          {onToggleExpanded && (
            <ExpandToggleButton
              isExpanded={isExpanded}
              onToggle={onToggleExpanded}
            />
          )}
        </div>
        <ProgressSection isExpanded={isExpanded} />
        <AnimatedControlsWrapper isExpanded={isExpanded}>
          <PlayerControls />
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
    className="absolute inset-0 z-0 pointer-events-none bg-glass"
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

  return (
    <div
      className="w-full px-4 sm:px-6 fixed bottom-8 left-0 right-0 z-40"
      style={{ minHeight: COLLAPSED_HEIGHT }}
    >
      <MiniPlayerProvider
        isExpanded={isExpanded}
        onToggleExpanded={() => setIsPinned((prev) => !prev)}
      >
        <motion.div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          layout
          className={cn(
            "relative rounded-xl mx-auto w-full max-w-4xl overflow-hidden border bg-zinc-500/10 text-white backdrop-blur-xl",
            isExpanded ? "border-zinc-500/20" : "border-zinc-500/20",
            "animate-container-glow"
          )}
          style={{ ...glowStyle, ...(reduceMotion ? {} : beatStyle) }}
          variants={containerVariants}
          initial="collapsed"
          animate={isExpanded ? "expanded" : "collapsed"}
        >
          <BackgroundOverlay />

          <CollapsedStateView glowStyle={glowStyle} />

          <ExpandedStateView glowStyle={glowStyle} />
        </motion.div>
      </MiniPlayerProvider>
    </div>
  );
}
