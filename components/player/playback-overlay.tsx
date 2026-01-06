"use client";

import { motion } from "motion/react";
import { Icons } from "../icons";
import { Minimize2 } from "lucide-react";
import { useIsPlaying } from "@/hooks/use-is-playing";
import { usePlayerStore } from "@/lib/store/player-store";
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ProgressBar, VolumeControl } from "./player-controls";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatTime } from "@/lib/utils/youtube";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const BottomControlItemContainer = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/1 transition-all duration-200 ease-out active:bg-white/25 px-3 h-10 select-none",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const BottomControlItemWithTooltip = ({
  children,
  className,
  tooltip,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  tooltip?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <BottomControlItemContainer className={className} {...props}>
          {children}
        </BottomControlItemContainer>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="z-[99]">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
};

const BottomPlayPauseButton = () => {
  const isPlaying = useIsPlaying();
  const dispatch = usePlayerStore((state) => state.dispatch);

  return (
    <BottomControlItemWithTooltip
      className="cursor-pointer aspect-square px-0 w-10"
      tooltip={isPlaying ? "Pause" : "Play"}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        dispatch({ type: "UserTogglePlay" });
      }}
    >
      {isPlaying ? (
        <Icons.Pause className="h-6 w-6 text-foreground trans" />
      ) : (
        <Icons.Play className="h-6 w-6 translate-x-px text-foreground trans" />
      )}
    </BottomControlItemWithTooltip>
  );
};

const BottomTimeDisplay = () => {
  const currentTime = usePlayerStore((state) => state.currentTime);
  const duration = usePlayerStore((state) => state.duration);

  return (
    <BottomControlItemContainer className="flex items-center justify-between text-sm font-mono gap-1">
      <span className="text-foreground">{formatTime(currentTime)}</span>
      <span className="text-foreground/50">/</span>
      <span className="text-foreground/50">{formatTime(duration)}</span>
    </BottomControlItemContainer>
  );
};

const BottomMinimizeButton = () => {
  const setVideoMode = useYouTubePlayerInstanceStore(
    (state) => state.setVideoMode
  );

  return (
    <BottomControlItemWithTooltip
      className="cursor-pointer aspect-square px-0 w-10"
      tooltip="Exit fullscreen"
      onClick={(e) => {
        e.stopPropagation();
        setVideoMode("floating");
      }}
    >
      <Minimize2 className="h-4 w-4 text-foreground" />
    </BottomControlItemWithTooltip>
  );
};

const BottomControls = ({ isHovering }: { isHovering: boolean }) => {
  return (
    <div
      className="absolute bottom-0 inset-x-0 z-20"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="group-hover/iframe-container:bg-linear-to-t group-hover/iframe-container:from-black/70 group-hover/iframe-container:to-transparent bg-transparent transition-all duration-200 ease-out absolute inset-0"></div>
      <div className="px-4 relative z-10">
        <motion.div
          layout="position"
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <ProgressBar className="my-3 group-hover/iframe-container:opacity-100 opacity-50 transition-opacity duration-200 ease-out" />
        </motion.div>

        <AnimatePresence>
          {isHovering && (
            <motion.div
              layout="position"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="flex items-center gap-2 pb-3">
                <BottomPlayPauseButton />
                <BottomTimeDisplay />
                <VolumeControl innerClassName="bg-white/5 hover:bg-white/10 active:bg-white/20 rounded-lg" />
                <div className="flex-1"></div>
                <BottomMinimizeButton />
              </div>
            </motion.div>
          )}
          {/* Row */}
        </AnimatePresence>
      </div>
    </div>
  );
};

interface VideoPlaybackOverlayProps {
  videoMode: "hidden" | "floating" | "fullscreen";
}

export function VideoPlaybackOverlay({ videoMode }: VideoPlaybackOverlayProps) {
  const isMobile = useIsMobile();
  const isPlaying = useIsPlaying();
  const dispatch = usePlayerStore((state) => state.dispatch);
  const [isHovering, setIsHovering] = useState(false);

  if (isMobile) {
    // Not implemented for mobile yet
    return null;
  }

  return (
    <div
      className="absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center z-20"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        dispatch({ type: "UserTogglePlay" });
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {videoMode === "fullscreen" && !isMobile && (
        <>
          <AnimatePresence mode="wait">
            {!isPlaying && (
              <motion.div
                key="playback-indicator" // Unique key forces fresh animation cycle for each indicator
                className="size-16 rounded-full bg-black/20 flex items-center justify-center"
                initial={{ scale: 0.8, opacity: 0 }} // Start scaled down and transparent
                animate={{ scale: 1, opacity: 1 }} // Animate to full size and opaque
                exit={{ scale: 1.2, opacity: 0 }} // Exit by scaling up and fading out
                transition={{ duration: 0.1, ease: "easeOut" }}
              >
                <Icons.Play className="size-8 text-foreground translate-x-px" />
              </motion.div>
            )}
          </AnimatePresence>

          <BottomControls isHovering={isHovering} />
        </>
      )}
    </div>
  );
}
