"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  MoreHorizontal,
  MonitorPlay,
  Repeat,
  Repeat1,
} from "lucide-react";
import {
  AnimatePresence,
  cubicBezier,
  motion,
  Variants,
  useReducedMotion,
} from "motion/react";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { usePlayerStore } from "@/lib/store/player-store";
import { useImageColors } from "@/hooks/use-image-colors";
import { useBeatSyncStyles } from "@/hooks/use-beat-sync";
import { getThumbnailUrl } from "@/lib/utils/youtube";
import {
  PlayPauseButton,
  ProgressBar,
  TimeDisplay,
  VolumeControl,
} from "@/components/player/player-controls";
import { cn } from "@/lib/utils";
import { Track } from "@/lib/types/playlist";
import { BackgroundOverlay, PlayerIconButton } from "./mini-player-view";
import { MiniPlayerMoreMenu } from "./mini-player-more-menu";
import { Icons } from "@/components/icons";
import {
  MiniPlayerProvider,
  useMiniPlayerContext,
} from "./mini-player-context";
import { VideoPlayerSlot } from "@/components/player/video-player-host";
import { FEATURE_FLAGS } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsPlaying } from "@/hooks/use-is-playing";

// =============================================================================
// Constants
// =============================================================================

const EXPANDED_HEIGHT = "100vh";
const COLLAPSED_HEIGHT = 66;

const EXPAND_DURATION = 0.5;
const COLLAPSE_DURATION = 0.5;
const EASING = cubicBezier(0.165, 0.84, 0.44, 1.0);

const getContainerVariants = (reduceMotion: boolean): Variants => ({
  collapsed: {
    height: COLLAPSED_HEIGHT,
    maxWidth: "56rem",
    transition: {
      duration: reduceMotion ? 0 : COLLAPSE_DURATION,
      ease: EASING,
    },
  },
  expanded: {
    height: EXPANDED_HEIGHT,
    maxWidth: "64rem",
    transition: {
      duration: reduceMotion ? 0 : EXPAND_DURATION,
      ease: EASING,
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
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: EASING }}
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

const InternalGlassGlow = ({
  isPlaying,
  glowStyle,
  variant,
}: {
  isPlaying: boolean;
  glowStyle: React.CSSProperties;
  variant: "collapsed" | "expanded";
}) => {
  if (!isPlaying) return null;

  if (variant === "collapsed") return null;

  const parseColorVar = (varName: string) => {
    const colorValue = glowStyle[varName as keyof React.CSSProperties] as
      | string
      | undefined;
    return colorValue || "rgba(255, 255, 255, 0.3)";
  };

  const color1 = parseColorVar("--glow-color-1");
  const color2 = parseColorVar("--glow-color-2");
  const color3 = parseColorVar("--glow-color-3");

  const isExpanded = variant === "expanded";
  const ambientOpacity = isExpanded ? 0.55 : 0.3;
  const glowBlendMode = isExpanded ? "screen" : "normal";

  return (
    <motion.div
      initial={false}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        zIndex: 1,
        borderRadius: isExpanded ? "0" : "0.75rem",
      }}
    >
      {/* Ambient wash */}
      <div
        className="absolute inset-0 animate-internal-glow-2"
        style={{
          background: `radial-gradient(120% 120% at 50% 15%, ${color1} 0%, transparent 62%),
            radial-gradient(120% 120% at 15% 85%, ${color2} 0%, transparent 58%),
            radial-gradient(120% 120% at 85% 85%, ${color3} 0%, transparent 60%)`,
          opacity: ambientOpacity,
          mixBlendMode: glowBlendMode,
          filter: "blur(40px)",
        }}
      />

      {/* Top glow */}
      <div
        className="absolute animate-internal-glow-1"
        style={{
          top: isExpanded ? "-35%" : "-25%",
          left: "50%",
          width: isExpanded ? "85%" : "60%",
          height: isExpanded ? "360px" : "150px",
          background: `radial-gradient(ellipse, ${color1} 0%, transparent 70%)`,
          transform: "translateX(-50%)",
          filter: "blur(50px)",
          mixBlendMode: glowBlendMode,
        }}
      />

      {/* Right glow */}
      <div
        className="absolute animate-internal-glow-2"
        style={{
          top: "50%",
          right: isExpanded ? "-25%" : "-20%",
          width: isExpanded ? "360px" : "150px",
          height: isExpanded ? "80%" : "50%",
          background: `radial-gradient(ellipse, ${color2} 0%, transparent 70%)`,
          transform: "translateY(-50%)",
          filter: "blur(50px)",
          mixBlendMode: glowBlendMode,
        }}
      />

      {/* Bottom glow */}
      <div
        className="absolute animate-internal-glow-3"
        style={{
          bottom: isExpanded ? "-35%" : "-25%",
          left: "50%",
          width: isExpanded ? "85%" : "60%",
          height: isExpanded ? "360px" : "150px",
          background: `radial-gradient(ellipse, ${color1} 0%, transparent 70%)`,
          transform: "translateX(-50%)",
          filter: "blur(50px)",
          mixBlendMode: glowBlendMode,
        }}
      />

      {/* Left glow */}
      <div
        className="absolute animate-internal-glow-1"
        style={{
          top: "50%",
          left: isExpanded ? "-25%" : "-20%",
          width: isExpanded ? "360px" : "150px",
          height: isExpanded ? "80%" : "50%",
          background: `radial-gradient(ellipse, ${color3} 0%, transparent 70%)`,
          transform: "translateY(-50%)",
          filter: "blur(50px)",
          mixBlendMode: glowBlendMode,
        }}
      />
    </motion.div>
  );
};

const TrackCoverCollapsed = ({ glowStyle }: TrackCoverProps) => {
  const { track } = useMiniPlayerContext();

  if (!track) return null;

  return (
    <div className="relative aspect-video h-10 shrink-0 overflow-visible">
      <div className="relative w-full h-full overflow-hidden rounded-md flex-none">
        <Image
          src={track.thumbnailUrl}
          alt={track.title}
          fill
          sizes="40px"
          className="object-cover"
        />
        <GlowLayer glowStyle={glowStyle} variant="collapsed" />
      </div>
    </div>
  );
};

const TrackCoverExpanded = ({ glowStyle }: TrackCoverProps) => {
  const { track } = useMiniPlayerContext();

  if (!track) return null;

  return (
    <motion.div
      layoutId="track-cover-mobile"
      className="relative shrink-0 overflow-visible rounded-lg flex-none aspect-video w-full max-w-lg mx-auto"
      transition={{ duration: EXPAND_DURATION, ease: EASING }}
    >
      <div className="relative w-full h-full overflow-hidden rounded-lg shadow-2xl">
        <Image
          src={getThumbnailUrl(track.id, "maxresdefault")}
          alt={track.title}
          fill
          sizes="90vw"
          className="object-cover"
        />
      </div>
      <GlowLayer glowStyle={glowStyle} variant="expanded" />
    </motion.div>
  );
};

const TrackInfo = ({ variant }: TrackInfoProps) => {
  const { track } = useMiniPlayerContext();
  const isCollapsed = variant === "collapsed";

  if (!track) return null;

  if (isCollapsed) {
    return (
      <div className="flex flex-col flex-1 min-w-0">
        {/* <Link
          href={`https://www.youtube.com/watch?v=${track.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit max-w-[50vw] flex"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        ></Link> */}
        <p className="max-w-[50vw] truncate text-sm">
          {track.title || "Loading..."}
        </p>
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs/tight text-neutral-400">
            {track.author || "Unknown Artist"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", "flex flex-col gap-3")}>
      <div key={`title-${track.id}`}>
        <Link
          href={`https://www.youtube.com/watch?v=${track.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline w-fit flex"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault(); // disable default link behavior
          }}
        >
          <h3 className="font-medium/tight text-base text-neutral-200 leading-snug line-clamp-2">
            {track.title || "Loading..."}
          </h3>
        </Link>
      </div>
      <div key={`author-${track.id}`}>
        <Link
          href={track.authorUrl ?? ""}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline w-fit flex"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <p className="truncate text-neutral-400 text-sm/tight">
            {track.author || "Unknown Artist"}
          </p>
        </Link>
      </div>
    </div>
  );
};

const ProgressSection = ({ isHovered }: { isHovered: boolean }) => (
  <motion.div
    className="flex flex-col gap-4 mt-7"
    initial={{ opacity: 0, y: 10 }}
    animate={{
      opacity: isHovered ? 1 : 0,
      y: isHovered ? 0 : 10,
    }}
    transition={{
      duration: 0.3,
      ease: EASING,
      delay: isHovered ? 0.15 : 0,
    }}
  >
    <ProgressBar />
    <TimeDisplay />
  </motion.div>
);

const PlayerControls = () => {
  const {
    isLoadingNewVideo,
    apiReady,
    canPlayNext,
    videoMode,
    onTogglePlay,
    onSkipBackward,
    onPlayNext,
    onToggleVideo,
  } = useMiniPlayerContext();

  const isPlaying = useIsPlaying();

  const { isShuffleEnabled, toggleShuffle, repeatMode, cycleRepeatMode } =
    usePlaylistStore();

  const repeatLabel =
    repeatMode === "one"
      ? "Repeat one"
      : repeatMode === "playlist"
        ? "Repeat playlist"
        : "Repeat off";

  const handleButtonClick = (callback: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    callback();
  };

  return (
    <div className="flex flex-col items-center gap-3 mt-2 text-foreground">
      {/* Main controls row */}
      <div className="flex items-center justify-center gap-3">
        <PlayerIconButton
          onClick={handleButtonClick(toggleShuffle)}
          label={isShuffleEnabled ? "Disable shuffle" : "Enable shuffle"}
          icon={<Icons.Shuffle />}
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

        <PlayerIconButton
          onClick={handleButtonClick(onSkipBackward)}
          label="Skip back"
          icon={<Icons.SkipBack />}
          variant="control"
          disabled={!apiReady}
        />

        <PlayerIconButton
          onClick={handleButtonClick(onTogglePlay)}
          label={isPlaying ? "Pause" : "Play"}
          icon={<Icons.Play />}
          variant="play"
          disabled={isLoadingNewVideo || !apiReady}
          aria-pressed={isPlaying}
        >
          {!apiReady || isLoadingNewVideo ? (
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : isPlaying ? (
            <Icons.Pause />
          ) : (
            <Icons.Play />
          )}
        </PlayerIconButton>

        <PlayerIconButton
          onClick={handleButtonClick(onPlayNext)}
          label="Skip forward"
          icon={<Icons.SkipForward />}
          variant="control"
          disabled={!canPlayNext}
        />

        <Tooltip>
          <TooltipTrigger asChild>
            <PlayerIconButton
              onClick={handleButtonClick(cycleRepeatMode)}
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
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6}>
            {repeatLabel}
          </TooltipContent>
        </Tooltip>

        {/* {FEATURE_FLAGS.ENABLE_VIDEO_PLAYBACK && (
          <PlayerIconButton
            onClick={handleButtonClick(onToggleVideo)}
            label={videoMode !== "hidden" ? "Disable video" : "Enable video"}
            icon={<MonitorPlay />}
            variant="control"
            className={videoMode !== "hidden" ? "bg-white/15 text-white" : ""}
            aria-pressed={videoMode !== "hidden"}
          />
        )} */}
      </div>
    </div>
  );
};

const PlaybackOptions = () => {
  return (
    <div className="flex items-center justify-center">
      <VolumeControl className="text-xs shrink-0" />
    </div>
  );
};

export const NextButton = () => {
  const dispatch = usePlayerStore((state) => state.dispatch);
  const { repeatMode, currentTrackIndex, playlists, currentPlaylistId } =
    usePlaylistStore();

  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);
  const canPlayNext =
    !!currentPlaylist &&
    (repeatMode === "playlist"
      ? currentPlaylist.tracks.length > 0
      : currentTrackIndex < currentPlaylist.tracks.length - 1);

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "UserNextTrack" })}
      disabled={!canPlayNext}
      className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 active:bg-white/20 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent transition-all duration-150"
    >
      <Icons.SkipForward className="h-5 w-5" />
    </button>
  );
};

const AnimatedControlsWrapper = ({
  isHovered,
  children,
}: {
  isHovered: boolean;
  children: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{
      opacity: isHovered ? 1 : 0,
      y: isHovered ? 0 : 10,
    }}
    transition={{
      duration: 0.3,
      ease: EASING,
      delay: isHovered ? 0.2 : 0,
    }}
  >
    {children}
  </motion.div>
);

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
      transition={{ duration: 0.3, ease: EASING }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Left */}
        <TrackCoverCollapsed glowStyle={glowStyle} />

        {/* Center */}
        <TrackInfo variant="collapsed" />

        {/* Right */}
        <div className="flex-none flex items-center">
          <PlayPauseButton variant="ghost" className="h-10 w-10" />
        </div>
      </div>
    </motion.div>
  );
};

const ExpandedViewCloseButton = ({ onClose }: { onClose: () => void }) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }}
      className="absolute top-6 left-4 flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 active:bg-white/20 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent transition-all duration-150"
    >
      <ChevronDown className="h-6 w-6" />
    </button>
  );
};

export const MoreButton = ({ track }: { track: Track }) => {
  return (
    <MiniPlayerMoreMenu track={track}>
      <button
        type="button"
        className="absolute top-6 right-4 flex h-10 w-10 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 active:bg-white/20 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent transition-all duration-150"
      >
        <MoreHorizontal className="h-6 w-6" />
      </button>
    </MiniPlayerMoreMenu>
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
  const { track, isExpanded, onClose, videoMode } = useMiniPlayerContext();

  if (!track) return null;

  return (
    <motion.div
      className="absolute inset-0 z-99 flex flex-col items-center px-6"
      initial={false}
      animate={{
        opacity: isExpanded ? 1 : 0,
        pointerEvents: isExpanded ? "auto" : "none",
      }}
      transition={{
        duration: 0.3,
        ease: EASING,
        delay: isExpanded ? 0.1 : 0,
      }}
    >
      {onClose && <ExpandedViewCloseButton onClose={onClose} />}
      <MoreButton track={track} />

      {/* TopNav Spacer  */}
      <div className="h-14 flex-none"></div>
      {videoMode !== "hidden" && FEATURE_FLAGS.ENABLE_VIDEO_PLAYBACK ? (
        <div className="py-10 flex-none w-full">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black/70 shadow-2xl">
            <VideoPlayerSlot
              active={true}
              className="yt-video-host absolute inset-0"
            />
          </div>
        </div>
      ) : (
        <div className="py-12 flex-none w-full">
          <TrackCoverExpanded glowStyle={glowStyle} />
        </div>
      )}

      <div className="flex flex-col w-full gap-3">
        <TrackInfo variant="expanded" />
        <ProgressSection isHovered={isExpanded} />
        <AnimatedControlsWrapper isHovered={isExpanded}>
          <div className="flex flex-col gap-8">
            <PlayerControls />
            <PlaybackOptions />
          </div>
        </AnimatedControlsWrapper>
      </div>
    </motion.div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export function MiniPlayerViewMobile() {
  const reduceMotion = useReducedMotion();
  const track = usePlaylistStore((state) => state.getCurrentTrack());
  const isPlaying = useIsPlaying();
  const [isOpen, setIsOpen] = React.useState(false);

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
        className="w-full px-4 sm:px-6 fixed bottom-8 left-0 right-0 z-60"
        style={{
          bottom: `-${COLLAPSED_HEIGHT}px`,
          minHeight: COLLAPSED_HEIGHT,
        }}
      />
    );
  }

  return (
    <div
      className="w-full px-4 sm:px-6 fixed bottom-8 left-0 right-0 z-60 trans"
      style={{
        minHeight: COLLAPSED_HEIGHT,
        paddingLeft: !isOpen ? "16px" : "0",
        paddingRight: !isOpen ? "16px" : "0",
        bottom: !isOpen ? `2rem` : "0",
      }}
    >
      <MiniPlayerProvider isExpanded={isOpen} onClose={() => setIsOpen(false)}>
        <motion.div
          onClick={(e) => {
            // Only toggle if not currently expanded (to allow drag when expanded)
            if (!isOpen) {
              e.stopPropagation();
              e.preventDefault();
              setIsOpen(true);
            }
          }}
          drag={isOpen ? "y" : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 1 }}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
          onDragEnd={(_, info) => {
            const DRAG_THRESHOLD = 120;
            const VELOCITY_THRESHOLD = 200;
            if (isOpen) {
              // Close if dragged down more than 150px or velocity is high enough
              const shouldClose =
                info.offset.y > DRAG_THRESHOLD ||
                info.velocity.y > VELOCITY_THRESHOLD;
              if (shouldClose) {
                setIsOpen(false);
              }
            }
          }}
          className={cn(
            "relative mx-auto w-full max-w-4xl overflow-hidden bg-zinc-500/10 text-white backdrop-blur-xl",
            isOpen
              ? "border-zinc-900/50"
              : "border-zinc-500/10 border rounded-xl trans",
            isPlaying && "animate-container-glow"
          )}
          style={
            isOpen ? {} : { ...glowStyle, ...(reduceMotion ? {} : beatStyle) }
          }
          variants={containerVariants}
          initial="collapsed"
          animate={isOpen ? "expanded" : "collapsed"}
        >
          <BackgroundOverlay />

          <CollapsedStateView glowStyle={glowStyle} />

          <ExpandedStateView glowStyle={glowStyle} />
        </motion.div>
      </MiniPlayerProvider>
    </div>
  );
}
