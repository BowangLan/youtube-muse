"use client";

import { motion } from "motion/react";
import { Icons } from "../icons";
import { useIsPlaying } from "@/hooks/use-is-playing";
import { usePlayerStore } from "@/lib/store/player-store";
import { AnimatePresence } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ProgressBar, TimeDisplay, VolumeControl } from "./player-controls";
import { useIsMobile } from "@/hooks/use-mobile";

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
          <div
            className="absolute bottom-0 inset-x-0 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="group-hover/iframe-container:bg-linear-to-t group-hover/iframe-container:from-black/70 group-hover/iframe-container:to-transparent bg-transparent transition-all duration-200 ease-out absolute inset-0"></div>
            <div className="p-6 relative z-10">
              <AnimatePresence mode="wait">
                {isHovering && (
                  <motion.div
                    key="time-display"
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <TimeDisplay className="text-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
              <ProgressBar className="mt-2 group-hover/iframe-container:opacity-100 opacity-50 transition-opacity duration-200 ease-out" />
              {/* <div className="flex mt-6 gap-2">
          <div className="flex-1"></div>
          <VolumeControl />
        </div> */}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
