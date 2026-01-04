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
import {
  ProgressBar,
  TimeDisplay,
  VolumeControl,
} from "@/components/player/player-controls";
import { cn } from "@/lib/utils";
import { Track } from "@/lib/types/playlist";
import { EASING_EASE_OUT } from "@/lib/styles/animation";
import { Icons } from "@/components/icons";
import { MonitorPlay, Repeat, Repeat1 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MiniPlayerProvider,
  useMiniPlayerContext,
} from "./mini-player-context";
import { FEATURE_FLAGS } from "@/lib/constants";

// =============================================================================
// PlayerIconButton Component
// =============================================================================

interface PlayerIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: React.ReactNode;
  className?: string;
  variant?: "control" | "play" | "toggle";
  "aria-pressed"?: boolean;
  children?: React.ReactNode;
}

export const PlayerIconButton = React.forwardRef<
  HTMLButtonElement,
  PlayerIconButtonProps
>(
  (
    {
      label,
      icon,
      className,
      variant = "control",
      disabled = false,
      "aria-pressed": ariaPressed,
      children,
      type = "button",
      ...buttonProps
    },
    ref
  ) => {
    const baseClasses =
      "flex items-center justify-center rounded-full transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/80";

    const variantClasses = {
      control:
        "h-10 w-10 text-white/80 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 active:bg-white/20 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent",
      play: "h-10 w-10 bg-white/10 text-white hover:bg-white/20 hover:scale-110 active:scale-95 active:bg-white/30 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-white/10",
      toggle:
        "h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 active:scale-95 active:bg-white/20",
    };

    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        aria-pressed={ariaPressed}
        disabled={disabled}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...buttonProps}
      >
        {children || icon}
      </button>
    );
  }
);
PlayerIconButton.displayName = "PlayerIconButton";

// =============================================================================
// Constants
// =============================================================================

const EXPANDED_HEIGHT = 200;
const EXPANDED_PADDING = 20;
const COLLAPSED_HEIGHT = 66;

const EXPAND_DURATION = 0.5;
const COLLAPSE_DURATION = 0.5;
const TOOLTIP_DELAY = 150;

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

interface StickyTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: React.ComponentProps<typeof TooltipContent>["side"];
  sideOffset?: number;
}

// =============================================================================
// Subcomponents
// =============================================================================

const StickyTooltip = ({
  content,
  children,
  side = "top",
  sideOffset = 6,
}: StickyTooltipProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const openTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const clearOpenTimeout = React.useCallback(() => {
    if (!openTimeoutRef.current) return;
    clearTimeout(openTimeoutRef.current);
    openTimeoutRef.current = null;
  }, []);

  React.useEffect(() => clearOpenTimeout, [clearOpenTimeout]);

  const handlePointerEnter = React.useCallback(() => {
    clearOpenTimeout();
    openTimeoutRef.current = setTimeout(() => setIsOpen(true), TOOLTIP_DELAY);
  }, [clearOpenTimeout]);

  const handlePointerLeave = React.useCallback(() => {
    clearOpenTimeout();
    setIsOpen(false);
  }, [clearOpenTimeout]);

  const handleFocus = React.useCallback(() => {
    clearOpenTimeout();
    setIsOpen(true);
  }, [clearOpenTimeout]);

  const handleBlur = React.useCallback(() => {
    clearOpenTimeout();
    setIsOpen(false);
  }, [clearOpenTimeout]);

  return (
    <Tooltip open={isOpen}>
      <TooltipTrigger
        asChild
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
};

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
      className="relative shrink-0 overflow-visible rounded-lg flex-none h-full aspect-video self-center"
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
    <motion.div>
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
    <motion.div>
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
    <div className={cn("min-w-0", !isCollapsed && "flex flex-col gap-1")}>
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
            <h3 className="font-medium/tight text-base text-neutral-200 leading-snug line-clamp-1 lg:line-clamp-2">
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

const ProgressSection = () => {
  return (
    <div className="flex flex-col gap-2 mt-6 flex-none">
      <ProgressBar />
      <TimeDisplay />
    </div>
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

  const { isShuffleEnabled, toggleShuffle, repeatMode, cycleRepeatMode } =
    usePlaylistStore();

  const repeatLabel =
    repeatMode === "one"
      ? "Repeat one"
      : repeatMode === "playlist"
        ? "Repeat playlist"
        : "Repeat off";

  return (
    <div className="flex flex-wrap items-center gap-2 lg:gap-3 xl:gap-4 mt-auto text-foreground relative">
      <StickyTooltip
        content={isShuffleEnabled ? "Shuffle: On" : "Shuffle: Off"}
      >
        <PlayerIconButton
          onClick={toggleShuffle}
          label={isShuffleEnabled ? "Disable shuffle" : "Enable shuffle"}
          icon={isShuffleEnabled ? <Icons.Shuffle /> : <Icons.Shuffle />}
          variant="control"
          className={isShuffleEnabled ? "text-white" : "text-white/50"}
          aria-pressed={isShuffleEnabled}
        >
          <div className="relative">
            <Icons.Shuffle className="h-5 w-5" />
            <div
              className="absolute -bottom-1 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-white transition-opacity duration-200"
              style={{ opacity: isShuffleEnabled ? 1 : 0 }}
            />
          </div>
        </PlayerIconButton>
      </StickyTooltip>

      <PlayerIconButton
        onClick={onSkipBackward}
        label="Skip back"
        icon={<Icons.SkipBack />}
        variant="control"
        disabled={!apiReady}
      />
      <PlayerIconButton
        onClick={onTogglePlay}
        label={isPlaying || pendingPlayState !== null ? "Pause" : "Play"}
        icon={<Icons.Play />}
        variant="play"
        disabled={isLoadingNewVideo || pendingPlayState !== null || !apiReady}
        aria-pressed={isPlaying || pendingPlayState !== null}
      >
        {!apiReady || isLoadingNewVideo ? (
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : isPlaying || pendingPlayState !== null ? (
          <Icons.Pause />
        ) : (
          <Icons.Play />
        )}
      </PlayerIconButton>
      <PlayerIconButton
        onClick={onPlayNext}
        label="Skip forward"
        icon={<Icons.SkipForward />}
        variant="control"
        disabled={!canPlayNext}
      />
      {FEATURE_FLAGS.ENABLE_VIDEO_PLAYBACK && (
        <PlayerIconButton
          onClick={onToggleVideo}
          label={isVideoEnabled ? "Disable video" : "Enable video"}
          icon={<MonitorPlay />}
          variant="control"
          className={isVideoEnabled ? "bg-white/15 text-white" : ""}
          aria-pressed={isVideoEnabled}
        />
      )}

      <StickyTooltip content={repeatLabel}>
        <PlayerIconButton
          onClick={cycleRepeatMode}
          label={repeatLabel}
          icon={
            repeatMode === "one" ? (
              <Repeat1 className="h-4 w-4" />
            ) : (
              <Repeat className="h-4 w-4" />
            )
          }
          variant="control"
          className={repeatMode !== "off" ? "text-white" : ""}
          aria-pressed={repeatMode !== "off"}
        />
      </StickyTooltip>

      <VolumeControl className="text-xs shrink-0 ml-auto" />
    </div>
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
      initial={{
        opacity: 0,
        pointerEvents: "none",
        filter: "blur(10px)",
      }}
      animate={{
        opacity: 1,
        pointerEvents: "auto",
        filter: "blur(0px)",
        transition: {
          duration: reduceMotion ? 0 : EXPAND_DURATION,
          ease: EASING_EASE_OUT,
          delay: 0.15,
        },
      }}
      exit={{
        opacity: 0,
        pointerEvents: "none",
        filter: "blur(10px)",
        transition: {
          duration: reduceMotion ? 0 : EXPAND_DURATION,
          ease: EASING_EASE_OUT,
        },
      }}
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
  const { track } = useMiniPlayerContext();

  if (!track) return null;

  return (
    <motion.div
      className="absolute inset-0 z-10 flex flex-row"
      initial={{
        opacity: 0,
        pointerEvents: "none",
        filter: "blur(10px)",
      }}
      animate={{
        opacity: 1,
        pointerEvents: "auto",
        filter: "blur(0px)",
        transition: {
          duration: reduceMotion ? 0 : EXPAND_DURATION,
          ease: EASING_EASE_OUT,
          delay: 0.15,
        },
      }}
      exit={{
        opacity: 0,
        pointerEvents: "none",
        filter: "blur(10px)",
        transition: {
          duration: reduceMotion ? 0 : EXPAND_DURATION,
          ease: EASING_EASE_OUT,
        },
      }}
      style={{
        padding: EXPANDED_PADDING,
        gap: EXPANDED_PADDING,
      }}
    >
      <TrackCoverExpanded glowStyle={glowStyle} />

      <div className="flex flex-col flex-1">
        <div className="flex items-start justify-between gap-4 flex-none">
          <TrackInfo variant="expanded" />
        </div>
        <ProgressSection />
        <PlayerControls />
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
    transition={{ duration: EXPAND_DURATION, ease: EASING_EASE_OUT }}
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

          {isExpanded ? (
            <ExpandedStateView glowStyle={glowStyle} />
          ) : (
            <CollapsedStateView glowStyle={glowStyle} />
          )}

          {/* <CollapsedStateView glowStyle={glowStyle} />
          <ExpandedStateView glowStyle={glowStyle} /> */}
        </motion.div>
      </MiniPlayerProvider>
    </div>
  );
}
