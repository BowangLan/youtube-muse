"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useYouTubePlayerInstanceStore } from "@/lib/store/youtube-player-instance-store";
import { usePlaylistStore } from "@/lib/store/playlist-store";
import {
  NextButton,
  PlayPauseButton,
  PreviousButton,
  ProgressBar,
  TimeDisplay,
} from "@/components/player/player-controls";
import { Minimize2 } from "lucide-react";
import { useV4AppStateStore } from "@/lib/store/v4-app-state-store";
import { RichButton } from "@/components/ui/rich-button";
import { AnimatePresence, motion } from "motion/react";
import { EASING_EASE_OUT } from "@/lib/styles/animation";

export function Focus() {
  const isFocusMode = useV4AppStateStore((state) => state.isFocusMode);
  const setIsFocusMode = useV4AppStateStore((state) => state.setIsFocusMode);
  const currentTrack = usePlaylistStore((state) => state.getCurrentTrack());

  return (
    <AnimatePresence initial={false}>
      {isFocusMode && currentTrack && (
        <motion.div
          key="focus"
          initial={{ opacity: 0, filter: "blur(10px)" }}
          animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 0.5, ease: EASING_EASE_OUT, delay: 0.1, } }}
          exit={{ opacity: 0, filter: "blur(10px)", transition: { duration: 0.3, ease: EASING_EASE_OUT, } }}
          className="fixed inset-0 min-h-0 flex-1 flex flex-col overflow-hidden z-90 backdrop-blur-xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          }}
        >
          <RichButton
            variant="ghost"
            size="icon"
            onClick={() => setIsFocusMode(false)}
            className="absolute top-4 left-4 sm:top-8 sm:left-8"
            tooltip="Exit focus mode"
            tooltipContentProps={{
              className: "z-[95]",
            }}
          >
            <Minimize2 className="size-4" />
          </RichButton>

          <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center py-6">
            <div className="w-full rounded-3xl">
              <div className="py-8 sm:py-12 flex flex-col items-center gap-6 text-center">
                <div className="w-full max-w-md space-y-1.5">
                  <h2 className="line-clamp-2 text-xl font-medium text-white sm:text-4xl">
                    {currentTrack.title}
                  </h2>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {currentTrack.author}
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-w-lg mx-auto">
                <ProgressBar showControlButtons />
                <TimeDisplay />
              </div>

              <div className="flex items-center justify-center gap-4 max-w-lg mx-auto pt-4">
                <PreviousButton className="h-11 w-11" />
                <PlayPauseButton className="h-14 w-14" />
                <NextButton className="h-11 w-11" />
              </div>

              <div className="flex-none h-16"></div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
