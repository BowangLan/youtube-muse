"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X,
  ChevronDown,
  ArrowDown,
  MoreVertical,
  MoreHorizontal,
} from "lucide-react";
import { AnimatePresence, cubicBezier, motion, Variants } from "motion/react";
import { usePlayerStore } from "@/lib/store/player-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import { useImageColors } from "@/hooks/use-image-colors";
import { useBeatSyncStyles } from "@/hooks/use-beat-sync";
import { formatTime, getThumbnailUrl } from "@/lib/utils/youtube";
import {
  PlayPauseButton,
  ProgressBar,
  TimeDisplay,
} from "@/components/player/player-controls";
import { cn } from "@/lib/utils";
import { Track } from "@/lib/types/playlist";
import { BackgroundOverlay } from "./mini-player-view";
import { MiniPlayerMoreMenu } from "./mini-player-more-menu";
import { Icons } from "@/components/icons";

// =============================================================================
// Constants
// =============================================================================

const EXPANDED_HEIGHT = "100vh";
const COLLAPSED_HEIGHT = 66;

const EXPAND_DURATION = 0.5;
const COLLAPSE_DURATION = 0.5;
const EASING = cubicBezier(0.165, 0.84, 0.44, 1.0);

const containerVariants: Variants = {
  collapsed: {
    height: COLLAPSED_HEIGHT,
    maxWidth: "56rem",
    transition: {
      duration: COLLAPSE_DURATION,
      ease: EASING,
    },
  },
  expanded: {
    height: EXPANDED_HEIGHT,
    maxWidth: "64rem",
    transition: {
      duration: EXPAND_DURATION,
      ease: EASING,
    },
  },
};

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
  const borderRadius = variant === "collapsed" ? "rounded-md" : "rounded-lg";

  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASING }}
          className={cn(
            "absolute inset-0 pointer-events-none animate-glow-pulse",
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

const TrackCoverCollapsed = ({
  track,
  isPlaying,
  glowStyle,
}: {
  track: Track;
  isPlaying: boolean;
  glowStyle: React.CSSProperties;
}) => {
  return (
    <div
      // layoutId="track-cover-mobile"
      // layout
      className="relative size-10 shrink-0 overflow-visible"
      // transition={{ duration: COLLAPSE_DURATION, ease: EASING }}
    >
      <div className="relative w-full h-full overflow-hidden rounded-md flex-none">
        <Image
          src={track.thumbnailUrl}
          alt={track.title}
          fill
          sizes="40px"
          className="object-cover"
        />
        <GlowLayer
          isPlaying={isPlaying}
          glowStyle={glowStyle}
          variant="collapsed"
        />
      </div>
    </div>
  );
  // return (
  //   <motion.div
  //     layoutId="track-cover-mobile"
  //     layout
  //     className="relative h-10 w-10 shrink-0 overflow-visible rounded-md"
  //     transition={{ duration: COLLAPSE_DURATION, ease: EASING }}
  //   >
  //     <div className="relative w-full h-full overflow-hidden rounded-md">
  //       <Image
  //         src={track.thumbnailUrl}
  //         alt={track.title}
  //         fill
  //         sizes="40px"
  //         className="object-cover"
  //       />
  //     </div>
  //     {/* <GlowLayer
  //     isPlaying={isPlaying}
  //     glowStyle={glowStyle}
  //     variant="collapsed"
  //   /> */}
  //   </motion.div>
  // );
};

const TrackCoverExpanded = ({
  track,
  isPlaying,
  glowStyle,
}: {
  track: Track;
  isPlaying: boolean;
  glowStyle: React.CSSProperties;
}) => {
  return (
    <motion.div
      layoutId="track-cover-mobile"
      className="relative shrink-0 overflow-visible rounded-lg flex-none w-[74vw] sm:w-[50vw] aspect-square"
      transition={{ duration: EXPAND_DURATION, ease: EASING }}
    >
      <div className="relative w-full h-full overflow-hidden rounded-lg shadow-2xl">
        <Image
          src={track.thumbnailUrl}
          alt={track.title}
          fill
          sizes="74vw"
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

const TrackInfo = ({ track, variant }: TrackInfoProps) => {
  const isCollapsed = variant === "collapsed";

  if (isCollapsed) {
    return (
      <div className="flex flex-col flex-1 min-w-0">
        <Link
          href={`https://www.youtube.com/watch?v=${track.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline w-fit max-w-[50vw] flex"
          onClick={(e) => {
            e.stopPropagation();
          }}
        ></Link>
        <p className="truncate text-sm">{track.title}</p>
        <div className="flex items-center gap-1.5">
          <p className="truncate text-xs/tight text-neutral-400">
            {track.author}
          </p>

          {/* Dot */}
          {/* <span className="size-[2px] rounded-full bg-neutral-400" /> */}

          {/* Total duration */}
          {/* <p className="truncate text-xs/tight text-neutral-400">
            {formatTime(track.duration)}
          </p> */}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", "flex flex-col gap-3")}>
      <motion.div layoutId="track-title-mobile">
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
            {track.title}
          </h3>
        </Link>
      </motion.div>
      <motion.div layoutId="track-author-mobile">
        <Link
          href={track.authorUrl ?? ""}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline w-fit flex"
          onClick={(e) => {
            e.stopPropagation();
          }}
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
    "flex h-14 w-14 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 active:bg-white/20 disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-transparent transition-all duration-150";

  const playButtonClass =
    "flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 active:scale-95 active:bg-white/30 disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-white/10 transition-all duration-150";

  return (
    <div className="flex items-center text-foreground justify-center gap-4 mt-2">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onSkipBackward();
        }}
        disabled={!apiReady}
        className={controlButtonClass}
      >
        <Icons.SkipBack className="h-7 w-7" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onTogglePlay();
        }}
        disabled={isLoadingNewVideo || pendingPlayState !== null || !apiReady}
        className={playButtonClass}
      >
        {!apiReady || isLoadingNewVideo ? (
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : isPlaying || pendingPlayState !== null ? (
          <Icons.Pause className="h-8 w-8" />
        ) : (
          <Icons.Play className="h-8 w-8 translate-x-[1px]" />
        )}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onPlayNext();
        }}
        disabled={!canPlayNext}
        className={controlButtonClass}
      >
        <Icons.SkipForward className="h-7 w-7" />
      </button>
    </div>
  );
};

export const NextButton = () => {
  const {
    playNext,
    repeatMode,
    currentTrackIndex,
    playlists,
    currentPlaylistId,
  } = usePlaylistStore();

  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);
  const canPlayNext =
    !!currentPlaylist &&
    (repeatMode === "playlist"
      ? currentPlaylist.tracks.length > 0
      : currentTrackIndex < currentPlaylist.tracks.length - 1);

  return (
    <button
      type="button"
      onClick={playNext}
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
  track,
  isPlaying,
  glowStyle,
  isHovered,
}: {
  track: Track;
  isPlaying: boolean;
  glowStyle: React.CSSProperties;
  isHovered: boolean;
}) => (
  <motion.div
    className="absolute inset-0 z-10 flex items-center gap-4 p-3"
    initial={false}
    animate={{
      opacity: isHovered ? 0 : 1,
      pointerEvents: isHovered ? "none" : "auto",
    }}
    transition={{ duration: 0.3, ease: EASING }}
  >
    <div className="flex items-center gap-3 min-w-0 flex-1">
      {/* Left */}
      <TrackCoverCollapsed
        track={track}
        isPlaying={isPlaying}
        glowStyle={glowStyle}
      />

      {/* Center */}
      <TrackInfo track={track} variant="collapsed" />

      {/* Right */}
      <div className="flex-none flex items-center">
        <PlayPauseButton variant="ghost" className="h-10 w-10" />
        {/* <NextButton /> */}
      </div>
    </div>
  </motion.div>
);

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
  track,
  isPlaying,
  glowStyle,
  isHovered,
  isLoadingNewVideo,
  pendingPlayState,
  apiReady,
  canPlayNext,
  onTogglePlay,
  onSkipBackward,
  onPlayNext,
  onClose,
}: {
  track: Track;
  isPlaying: boolean;
  glowStyle: React.CSSProperties;
  isHovered: boolean;
  isLoadingNewVideo: boolean;
  pendingPlayState: boolean | null;
  apiReady: boolean;
  canPlayNext: boolean;
  onTogglePlay: () => void;
  onSkipBackward: () => void;
  onPlayNext: () => void;
  onClose: () => void;
}) => (
  <motion.div
    className="absolute inset-0 z-99 flex flex-col items-center px-6"
    initial={false}
    animate={{
      opacity: isHovered ? 1 : 0,
      pointerEvents: isHovered ? "auto" : "none",
    }}
    transition={{
      duration: 0.3,
      ease: EASING,
      delay: isHovered ? 0.1 : 0,
    }}
  >
    <ExpandedViewCloseButton onClose={onClose} />
    <MoreButton track={track} />

    {/* TopNav Spacer  */}
    <div className="h-14 flex-none"></div>
    <div className="py-12 flex-none">
      <TrackCoverExpanded
        track={track}
        isPlaying={isPlaying}
        glowStyle={glowStyle}
      />
    </div>

    <div className="flex flex-col w-full gap-3">
      <TrackInfo track={track} variant="expanded" />
      <ProgressSection isHovered={isHovered} />
      <AnimatedControlsWrapper isHovered={isHovered}>
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

// =============================================================================
// Main Component
// =============================================================================

export function MiniPlayerViewMobile() {
  const track = usePlaylistStore((state) => state.getCurrentTrack());
  const {
    togglePlay,
    isLoadingNewVideo,
    apiReady,
    pendingPlayState,
    isPlaying,
    skipBackward,
  } = usePlayerStore();
  const {
    playNext,
    repeatMode,
    currentTrackIndex,
    playlists,
    currentPlaylistId,
  } = usePlaylistStore();

  const [isOpen, setIsOpen] = React.useState(false);

  // Extract colors from thumbnail for glow effect
  const thumbnailUrl = track
    ? getThumbnailUrl(track.id, "mqdefault")
    : undefined;
  const colors = useImageColors(thumbnailUrl);
  const glowStyle = useGlowStyle(colors);
  // const glowStyle = {};

  // Get beat-synced animation timing
  const { style: beatStyle } = useBeatSyncStyles();
  // const beatStyle = {};

  const currentPlaylist = playlists.find((p) => p.id === currentPlaylistId);
  const canPlayNext =
    !!currentPlaylist &&
    (repeatMode === "playlist"
      ? currentPlaylist.tracks.length > 0
      : currentTrackIndex < currentPlaylist.tracks.length - 1);

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

  const _isPlaying = isPlaying || pendingPlayState !== null;

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
      <motion.div
        onClick={(e) => {
          // Only toggle if not currently expanded (to allow drag when expanded)
          if (!isOpen) {
            e.stopPropagation();
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        // whileTap={{ scale: isOpen ? 1 : 0.95 }}
        drag={isOpen ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 1 }}
        dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
        onDragEnd={(_, info) => {
          const DRAG_THRESHOLD = 80;
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
            ? "border-zinc-900/50 rounded-t-2xl"
            : "border-zinc-500/10 border rounded-xl trans",
          _isPlaying && "animate-container-glow"
        )}
        style={isOpen ? {} : { ...glowStyle, ...beatStyle }}
        variants={containerVariants}
        initial="collapsed"
        animate={isOpen ? "expanded" : "collapsed"}
      >
        <BackgroundOverlay />

        {/* Too heavy */}
        {/* <InternalGlassGlow
          isPlaying={_isPlaying}
          glowStyle={glowStyle}
          variant={isOpen ? "expanded" : "collapsed"}
        /> */}

        <CollapsedStateView
          track={track}
          isPlaying={isPlaying}
          glowStyle={glowStyle}
          isHovered={isOpen}
        />

        <ExpandedStateView
          track={track}
          isPlaying={isPlaying}
          glowStyle={glowStyle}
          isHovered={isOpen}
          isLoadingNewVideo={isLoadingNewVideo}
          pendingPlayState={pendingPlayState}
          apiReady={apiReady}
          canPlayNext={canPlayNext}
          onTogglePlay={togglePlay}
          onSkipBackward={skipBackward}
          onPlayNext={playNext}
          onClose={() => setIsOpen(false)}
        />
      </motion.div>
    </div>
  );
}
